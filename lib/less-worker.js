/**
Worker that actually compiles the LESS.
**/

var fs = require('graceful-fs');
var path = require('path');
var less = require('less');
var mkdirp = require('mkdirp');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var cli = require('./cli');
var utils = require('./utils');
var Logger = require('./logger');

module.exports = LessWorker;

inherits(LessWorker, EventEmitter);
Logger.mixin(LessWorker);

/**
The wrapper for compiling LESS.

@class LessWorker
@constructor
@mixin Logger
@param {Object} [options]
**/
function LessWorker(options) {
    // factory constructor
    if (!(this instanceof LessWorker)) {
        return new LessWorker(options);
    }

    this._applyConfig(options);

    Logger.call(this, this.options);

    this._fileData = {};
    this._pathCache = {};
    this._pathRebase = {};
    this._logPrefix = "wrapper";

    this.on('error', this.error);

    if (this.options.fileData) {
        this.updateFileData(this.options.fileData);
    }

    this._bindImporter();
}

LessWorker.defaults = cli.workerDefaults;

// cache original importer function for restoration during destroy()
LessWorker._originalLessImporter = less.Parser.importer;

LessWorker.prototype.destroy = function () {
    this._fileData = this._pathCache = this._pathRebase = null;
    less.Parser.importer = LessWorker._originalLessImporter;
    this.emit('cleanup');
    this.removeAllListeners();
};

LessWorker.prototype._applyConfig = function (options) {
    this.options = utils.merge(LessWorker.defaults, options);
};

LessWorker.prototype._bindImporter = function () {
    // override static importer method to utilize _fileData cache
    less.Parser.importer = this._importer.bind(this);
};

LessWorker.prototype._onParsed = function (destFileName, err, tree) {
    var options = this.options;
    if (err) {
        less.writeError(err, options);
        this.emit('error', err);
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
            this.emit('error', e);
        }
    }
};

LessWorker.prototype.writeOutput = function (fileName, data) {
    // if results are empty, don't bother writing
    if (!data) {
        this.warn('skipping empty output of ' + path.relative(process.cwd(), fileName));
        this.emit('drain', fileName);
        return;
    }

    mkdirp(path.dirname(fileName), this.inDir.bind(this, fileName, data));
};

LessWorker.prototype.inDir = function (fileName, data, err) {
    if (err) {
        this.emit('error', err);
    } else {
        fs.writeFile(fileName, data, 'utf8', this.doneWrote.bind(this, fileName));
    }
};

LessWorker.prototype.doneWrote = function (fileName, err) {
    if (err) {
        this.emit('error', err);
    } else {
        this.log('compiled ' + path.relative(process.cwd(), fileName));
        this.emit('drain', fileName);
    }
};

LessWorker.prototype.build = function (msg) {
    var file = msg.file,
        dest = msg.dest,
        data = this._fileData[file],
        parser = this._createParser(file, dest);

    this.debug(this._logPrefix, "BUILDING", dest);

    // propagate destination file to callback via bind
    parser.parse(data, this._onParsed.bind(this, dest));
};

LessWorker.prototype.updateFileData = function (data) {
    utils.mix(this._fileData, data);
};

LessWorker.prototype._createParseEnv = function (fileName, destFileName) {
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
};

LessWorker.prototype._createParser = function (fileName, destFileName) {
    var env = this._createParseEnv(fileName, destFileName);

    return new less.Parser(env);
};

// Actually support --include-path args...
LessWorker.prototype.resolveChildPath = function (file, parentFilePath, envPaths) {
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
};

LessWorker.prototype.rebaseRootPath = function (file, parentFilePath, childFileInfo) {
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
};

LessWorker.prototype._rebaseRootPath = function (fromPath, toPath) {
    var rebased = path.relative(fromPath, toPath);
    return path.normalize(rebased + path.sep);
};

LessWorker.prototype._importer = function (file, parentFileInfo, callback, parentEnv) {
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
        childPath = this.resolveChildPath(file, parentFileInfo.filename, parentEnv.paths),

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
            this.debug(this._logPrefix, "Imported", childPath);
        } catch (ex) {
            return callback(new Error('File not found: ' + childPath));
        }
    }

    new less.Parser(childEnv).parse(childData, function (e, root) {
        callback(e, root, childPath);
    });
};
