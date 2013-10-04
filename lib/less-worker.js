/**
Worker process that actually compiles the LESS.
**/

var cluster = require('cluster');
var fs = require('fs');
var path = require('path');
var less = require('less');
var mkdirp = require('mkdirp');

var cli = require('./cli');
var utils = require('./utils');
var readFiles = require('./read-files');
var Logger = require('./logger');

module.exports = LessWorker;

Logger.mixin(LessWorker);

/**
The worker process for compiling LESS.

@class LessWorker
@constructor
@param {Object} [options]
@param {Function} [cb]
**/
function LessWorker(options, cb) {
    // factory constructor
    if (!(this instanceof LessWorker)) {
        return new LessWorker(options, cb);
    }

    Logger.call(this, options);

    this._fileData = {};
    this._pathCache = {};
    this._pathRebase = {};

    if (cluster.isWorker) {
        this.init(options, cb);
    }
}

LessWorker.defaults = cli.workerDefaults;

utils.mix(LessWorker.prototype, {
    init: function (options, cb) {
        if ("function" === typeof options) {
            cb = options;
            options = {};
        }
        if (!options) {
            options = {};
        }

        this._applyConfig(options);
        this._attachEvents(cb);

        // override static importer method to utilize _fileData cache
        less.Parser.importer = this._importer.bind(this);
    },

    _applyConfig: function (options) {
        this.options = utils.merge(LessWorker.defaults, options);
    },

    _attachEvents: function (cb) {
        process.on('message', this.dispatchMessage.bind(this));

        if (cb) {
            cb();
        }
    },

    sendMaster: function (evt) {
        // avoids uncaught exception when the master has disconnected already.
        if (process.connected) {
            process.send({ evt: evt, id: cluster.worker.id });
        }
    },

    dispatchMessage: function (msg) {
        if (!msg || !msg.hasOwnProperty('cmd')) {
            throw "Message must have command";
        }

        var cmd = msg.cmd;
        if (cmd === 'build') {
            this.build(msg);
        } else if (cmd === 'start') {
            this.start(msg);
        } else {
            throw "Message command invalid";
        }
    },

    _onParsed: function (destFileName, err, tree) {
        var options = this.options;
        if (err) {
            less.writeError(err, options);
            this.sendMaster('error');
        } else {
            try {
                var css = tree.toCSS({
                    silent: options.silent,
                    verbose: options.verbose,
                    ieCompat: options.ieCompat,
                    compress: options.compress,
                    yuicompress: options.yuicompress,
                    maxLineLen: options.maxLineLen,
                    strictMath: options.strictMath,
                    strictUnits: options.strictUnits
                });
                this.writeOutput(destFileName, css);
            } catch (e) {
                less.writeError(e, options);
                this.sendMaster('error');
            }
        }
    },

    writeOutput: function (fileName, data) {
        // if results are empty, don't bother writing
        if (!data) {
            this.warn('skipping empty output of ' + path.relative(process.cwd(), fileName));
            this.sendMaster('drain');
            return;
        }

        mkdirp(path.dirname(fileName), this.inDir.bind(this, fileName, data));
    },

    inDir: function (fileName, data, err) {
        if (err) {
            this.error(err);
            this.sendMaster('error');
        } else {
            fs.writeFile(fileName, data, 'utf8', this.doneWrote.bind(this, fileName));
        }
    },

    doneWrote: function (fileName, err) {
        if (err) {
            this.error(err);
            this.sendMaster('error');
        } else {
            this.log('compiled ' + path.relative(process.cwd(), fileName));
            this.sendMaster('drain');
        }
    },

    build: function (msg) {
        var file = msg.file,
            dest = msg.dest,
            data = this._fileData[file],
            parser = this._createParser(file, dest);

        this.debug("worker[%d] BUILDING %s", cluster.worker.id, dest);

        // propagate destination file to callback via bind
        parser.parse(data, this._onParsed.bind(this, dest));
    },

    _createParseEnv: function (fileName, destFileName) {
        // copy options to avoid munging between executions
        var options = utils.merge(this.options),
            entryPath = path.dirname(fileName);

        // set before env instantiation to avoid defaulting
        options.currentFileInfo = {
            filename        : fileName,
            rootFilename    : fileName,
            relativeUrls    : options.relativeUrls,
            rootpath        : options.rootpath,
            destPath        : path.dirname(destFileName),
            currentDirectory: entryPath,
            entryPath       : entryPath
        };

        // copying over cached data avoids repetitious disk seeks
        options.contents = this._fileData;

        return new less.tree.parseEnv(options);
    },

    _createParser: function (fileName, destFileName) {
        var env = this._createParseEnv(fileName, destFileName);

        return new less.Parser(env);
    },

    // Actually support --include-path args...
    _getChildPath: function (file, parentFilePath, envPaths) {
        var i, len, importPaths,
            childPath = this._pathCache[file];

        // Early return if cached value exists
        if (childPath) {
            return childPath;
        }

        // Loop through the parent file's current directory,
        // any available paths provided by the environment,
        // and process.cwd().
        importPaths = [path.dirname(parentFilePath)].concat(envPaths, ['.']);

        for (i = 0, len = importPaths.length; i < len; i += 1) {
            childPath = path.resolve(importPaths[i], file);
            if (fs.existsSync(childPath)) {
                // indicate if found outside parent directory
                this._pathRebase[file] = !!i;
                // cache the stat for performance
                this._pathCache[file] = childPath;
                return childPath;
            }
        }
    },

    rebaseRootPath: function (file, parentFilePath, childFileInfo) {
        var childRoot;

        if (this._pathRebase[file]) {
            // relative from destination path
            childRoot = this._rebaseRootPath(childFileInfo.destPath, childFileInfo.currentDirectory);
        }
        else if (childFileInfo.rootFilename === parentFilePath &&
            childFileInfo.entryPath !== childFileInfo.currentDirectory) {
            // relative from root file source path
            childRoot = this._rebaseRootPath(childFileInfo.entryPath, childFileInfo.currentDirectory);
        }

        if (childRoot) {
            childFileInfo.rootpath += childRoot;
        }
    },

    _rebaseRootPath: function (fromPath, toPath) {
        var rebased = path.relative(fromPath, toPath);
        return path.normalize(rebased + path.sep);
    },

    _importer: function (file, parentFileInfo, callback, parentEnv) {
        // make copy of parentEnv to avoid corrupting parent
        var childEnv = new less.tree.parseEnv(parentEnv),

            // new object to avoid carrying over all of parentEnv.currentFileInfo
            childFileInfo = {
                relativeUrls: parentEnv.relativeUrls,
                destPath    : parentFileInfo.destPath,
                entryPath   : parentFileInfo.entryPath,
                rootpath    : parentFileInfo.rootpath,
                rootFilename: parentFileInfo.rootFilename
            },

            // resolve child filename against parent filepath
            childPath = this._getChildPath(file, parentFileInfo.filename, parentEnv.paths),

            // derive child dirname for currentDirectory
            childDir = path.dirname(childPath),

            // retrieve cached file contents from instance hash
            childData = this._fileData[childPath];

        // only the top importing parser visits imports
        childEnv.processImports = false;

        // contents of childPath are already cached (usually)
        // childEnv.contents[childPath] = childData;

        childFileInfo.currentDirectory = childDir;
        childFileInfo.filename = childPath;

        // rebase relative paths if traversing directory hierarchy
        this.rebaseRootPath(file, parentFileInfo.filename, childFileInfo);

        childEnv.currentFileInfo = childFileInfo;

        if (!childData) {
            try {
                // In the event an import reaches "below" the target directory,
                // quickly patch it here. Using sync because this should be rare.
                childData = fs.readFileSync(childPath, 'utf8');

                // Updating top importing parser content cache.
                childEnv.contents[childPath] = childData;
                this.debug("worker[%d] Imported %s", cluster.worker.id, childPath);
            } catch (ex) {
                return callback(new Error('File not found: ' + childPath));
            }
        }

        new less.Parser(childEnv).parse(childData, function (e, root) {
            callback(e, root, childPath);
        });
    },

    _readFinished: function (err, data) {
        if (err) {
            this.error(err);
            this.sendMaster('error');
            return;
        }

        this.debug('worker[' + cluster.worker.id + '] finished reading');

        // add data to cache
        utils.mix(this._fileData, data);

        // tell our master that we are ready
        this.sendMaster('ready');
    },

    start: function (msg) {
        this.debug('worker[' + cluster.worker.id + '] started');

        readFiles(msg.data, this._readFinished.bind(this));
    }
});

if (cluster.isWorker) {
    /*jshint newcap: false */
    LessWorker(cli.parse());
}
