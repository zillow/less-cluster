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

/**
The worker process for compiling LESS.

@class LessWorker
@constructor
@param {Object} [options]
@param {Function} [cb]
**/
var LessWorker = module.exports = function (options, cb) {
    // factory constructor
    if (!(this instanceof LessWorker)) {
        return new LessWorker(options, cb);
    }

    this._fileData = {};

    if (cluster.isWorker) {
        this.init(options, cb);
    }
};

LessWorker.defaults = cli.workerDefaults;

LessWorker.prototype = {
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
        process.connected && process.send({ evt: evt, id: cluster.worker.id });
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

    _onParsed: function (err, tree) {
        var options = this.options;
        if (err) {
            less.writeError(err, options);
            this.sendMaster('error');
        } else {
            try {
                var css = tree.toCSS({
                    compress: options.compress,
                    yuicompress: options.yuicompress,
                    strictMaths: options.strictMaths,
                    strictUnits: options.strictUnits
                });
                // this._write(options.destfile, css);
                this.writeOutput(options.destfile, css);
            } catch (e) {
                less.writeError(e, options);
                this.sendMaster('error');
            }
        }
    },

    _write: function (fileName, data) {
        var self = this;

        // if results are empty, don't bother writing
        if (!data) {
            console.log('skipping empty output of ' + path.relative(process.cwd(), fileName));
            self.sendMaster('drain');
            return;
        }

        mkdirp(path.dirname(fileName), function (errDir) {
            if (errDir) {
                console.error(errDir);
                self.sendMaster('error');
            } else {
                fs.writeFile(fileName, data, 'utf8', function (errFile) {
                    if (errFile) {
                        console.error(errFile);
                        self.sendMaster('error');
                    } else {
                        console.log('compiled ' + path.relative(process.cwd(), fileName));
                        self.sendMaster('drain');
                    }
                });
            }
        });
    },

    writeOutput: function (fileName, data) {
        // if results are empty, don't bother writing
        if (!data) {
            console.log('skipping empty output of ' + path.relative(process.cwd(), fileName));
            this.sendMaster('drain');
            return;
        }

        mkdirp(path.dirname(fileName), this.withDir.bind(this, fileName, data));
    },

    withDir: function (fileName, data, err) {
        if (err) {
            console.error(err);
            this.sendMaster('error');
        } else {
            fs.writeFile(fileName, data, 'utf8', this.done.bind(this, fileName));
        }
    },

    done: function (fileName, err) {
        if (err) {
            console.error(err);
            this.sendMaster('error');
        } else {
            console.log('compiled ' + path.relative(process.cwd(), fileName));
            this.sendMaster('drain');
        }
    },

    build: function (msg) {
        var file = msg.file,
            dest = msg.dest,
            data = this._fileData[file],
            parser = this._createParser(file);

        // propagate destination file to callback
        this.options.destfile = dest;

        parser.parse(data, this._onParsed.bind(this));
    },

    _createParser: function (fileName) {
        var env = new less.tree.parseEnv(this.options);

        // copying over cached data avoids repetitious disk seeks
        env.contents = this._fileData;
        env.filename = fileName;
        env.currentDirectory = path.dirname(fileName);

        return new less.Parser(env);
    },

    _importer: function (file, paths, callback, parentEnv) {
        // make copy of parentEnv to avoid corrupting parent
        var childEnv = new less.tree.parseEnv(parentEnv),

            // resolve child filename against parent filepath
            childPath = path.resolve(path.dirname(parentEnv.filename), file),

            // derive child dirname for currentDirectory and paths augmentation
            childDir = path.dirname(childPath),

            // retrieve cached file contents from instance hash
            childData = this._fileData[childPath];

        if (!childData) {
            return callback(new Error('File not found: ' + childPath));
        }

        if (childEnv.relativeUrls) {
            childEnv.currentDirectory = childDir;
        }

        // Updating top importing parser content cache.
        // childEnv.contents[childPath] = childData;
        childEnv.paths = [childDir].concat(paths);
        childEnv.filename = childPath;

        new less.Parser(childEnv).parse(childData, function (e, root) {
            callback(e, root, childPath);
        });
    },

    _readFinished: function (err, data) {
        if (err) {
            this.sendMaster('error');
            return;
        }

        // add data to cache
        utils.mix(this._fileData, data);

        // tell our master that we are ready
        this.sendMaster('ready');
    },

    start: function (msg) {
        console.log('worker[' + cluster.worker.id + '] started');

        readFiles(msg.data, this._readFinished.bind(this));
    }
};

if (cluster.isWorker) {
    /*jshint newcap: false */
    LessWorker(cli.parse());
}
