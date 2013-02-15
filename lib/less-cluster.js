/**
less-cluster provides a wrapper around a less.Parser,
making it smarter about directories and parallel execution.
**/

var glob = require('glob');
var path = require('path');
var cluster = require('cluster');
var EventEmitter = require('events').EventEmitter;

var utils = require('./utils');
var readFiles = require('./read-files');

/**
Make the LESS compiler faster with large batches.

@class LessCluster
@constructor
@extends EventEmitter
**/
var LessCluster = module.exports = function (config) {
    // factory constructor
    if (!(this instanceof LessCluster)) {
        return new LessCluster(config);
    }

    EventEmitter.call(this);

    // merge config with defaults, running guards
    var opts = this.options = LessCluster.checkArguments(config);

    // seed dependency graph(s)
    this._parents = {};
    this._children = {};
    this._fileData = {};

    if (opts.cli) {
        this.run();
    }
};

require('util').inherits(LessCluster, EventEmitter);

LessCluster.defaults = require('./cli').masterDefaults;

LessCluster.checkArguments = function (config) {
    var options = utils.merge(LessCluster.defaults, config);

    // default directory to cwd
    if (!options.directory) {
        options.directory = process.cwd();
    }

    // default outputdir to directory
    if (!options.outputdir && options.directory) {
        options.outputdir = options.directory;
    }

    return options;
};

/**
Regular expression that is used to extract imports from a LESS file.

@property RX_IMPORT
@type {RegExp}
@static
**/
LessCluster.RX_IMPORT = /\@import\s+["'](.+)['"];/g;

utils.mix(LessCluster.prototype, {
    /**
    Start the ball rolling.

    @method run
    **/
    run: function () {
        if (cluster.isMaster) {
            this.setupMaster({
                exec: __dirname + '/less-worker.js'
            });
            this.forkWorkers(this.collect.bind(this));
        }
    },

    /**
    Destroy all workers and clean up event listeners.

    @method destroy
    **/
    destroy: function () {
        this._detachEvents();
    },

    /**
    Pass options to cluster.setupMaster().

    @method setupMaster
    @param {Object} options
    @protected
    **/
    setupMaster: function (options) {
        cluster.on('setup', this._attachEvents.bind(this));
        cluster.setupMaster(options);
    },

    /**
    Attach listeners to cluster lifecycle events.

    @method _attachEvents
    @private
    **/
    _attachEvents: function () {
        this._bindProcess();
        this._bindCluster();
        this._bindWorkers();
    },

    /**
    Detach listeners from cluster lifecycle events.

    @method _detachEvents
    @private
    **/
    _detachEvents: function () {
        process.removeAllListeners();
        cluster.removeAllListeners();
        this.removeAllListeners();
    },

    _bindCluster: function () {
        cluster.on('fork',          this._workerForked.bind(this));
        cluster.on('online',        this._workerOnline.bind(this));
        cluster.on('disconnect',    this._workerDisconnected.bind(this));
        cluster.on('exit',          this._workerExited.bind(this));
    },

    _bindProcess: function () {
        var boundGraceful = this._graceful.bind(this);

        process.on('SIGINT',  boundGraceful);
        process.on('SIGTERM', boundGraceful);
    },

    _bindWorkers: function () {
        this.on('drain', this.onDrain);
        this.on('empty', this.onEmpty);
        this.on('finished', this._graceful);
    },

    /**
    Disconnect all workers and destroy self, gracefully.

    @method _graceful
    @private
    **/
    _graceful: function () {
        cluster.disconnect(this.destroy.bind(this));
    },

    _workerForked: function (worker) {
        console.log('worker[' + worker.id + '] forked.');
    },

    _workerOnline: function (worker) {
        console.log('worker[' + worker.id + '] online.');
        worker.on('message', this.onMessage.bind(this));
    },

    _workerDisconnected: function (worker) {
        console.log('worker[' + worker.id + '] disconnected.');
    },

    _workerExited: function (worker, code, signal) {
        console.log('worker[' + worker.id + '] exited.');

        if (!worker.suicide) {
            // oh noes!
            console.error('worker[' + worker.id + '] did not suicide. Respawning...');
            cluster.fork();
        }
    },

    sendWorkers: function (payload) {
        Object.keys(cluster.workers).forEach(function (id) {
            cluster.workers[id].send(payload);
        });
    },

    /**
    Fork and setup event listeners for all workers.

    @method forkWorkers
    @param {Function} [cb]
    @protected
    **/
    forkWorkers: function (cb) {
        var i = 0, numWorkers = this.options.workers;
        for (; i < numWorkers; i += 1) {
            cluster.fork();
        }

        if (cb) {
            cb();
        }
    },

    /**
    Get a filename off the stack.

    @method getNextFile
    @return {String|Boolean} the next filename, or false if none remain
    **/
    getNextFile: function () {
        return this.filesToProcess.length && this.filesToProcess.shift();
    },

    /**
    Sets instance properties and sends 'start' command to all workers.

    @method _startWorkers
    @param {Array} filesToProcess
    @private
    **/
    _startWorkers: function (filesToProcess) {
        this.filesToProcess = filesToProcess;
        this.readied = 0;
        this.sendWorkers({
            cmd: 'start',
            data: filesToProcess
        });
    },

    /**
    If no batch is running, it begins a new batch of files to process.
    Otherwise, wait for the current batch to finish before restarting.

    @method startQueue
    @param {Array} filesToProcess
    **/
    startQueue: function (filesToProcess) {
        if (!this.running) {
            // prepare workers to process files
            this._startWorkers(filesToProcess);
        } else {
            // enqueue after current batch finished
            this.once('finished', this._startWorkers.bind(this, filesToProcess));
        }
    },

    /**
    Send a filename to the designated worker to be built.

    @method buildFile
    @param {Number} id of worker
    @param {String} fileName
    **/
    buildFile: function (id, fileName) {
        var worker = cluster.workers[id];
        if (worker && fileName) {
            worker.send({
                cmd: 'build',
                dest: this._getDestinationPath(fileName),
                file: fileName
            });
        }
    },

    /**
    Iterator for runQueue loop over workers. Each file succesfully
    passed to buildFile increments `running` instance property.

    @method _enqueueWorker
    @param {Number} id
    @private
    **/
    _enqueueWorker: function (id) {
        var fileName = this.getNextFile();
        if (fileName) {
            this.buildFile(id, fileName);
            this.running += 1;
        }
    },

    /**
    Run the queue after all the workers have responded "ready", resetting
    instance property `running` to zero.

    @method runQueue
    **/
    runQueue: function () {
        this.running = 0;
        Object.keys(cluster.workers).forEach(this._enqueueWorker.bind(this));
    },

    /**
    Listener for master 'drain' event, which is emitted
    when a worker sends a message with the 'drain' command.

    If files remain to be processed, it is picked off the
    stack and sent to the worker. Otherwise, emit 'empty' for
    this worker.

    @method onDrain
    @param {Number} id
    @protected
    **/
    onDrain: function (id) {
        var fileName = this.getNextFile();
        if (fileName) {
            this.buildFile(id, fileName);
        } else {
            this.emit('empty', id);
        }
    },

    /**
    Listener for master's 'empty' event, which is emitted inside onDrain
    when a worker reaches the end of the filesToProcess list.

    When all running workers have emptied, it emits 'finished'.

    @method onEmpty
    @param {Number} id
    @protected
    **/
    onEmpty: function (id) {
        console.log('worker[' + id + '] finished');
        if (--this.running === 0) {
            this.emit('finished');
        }
    },

    /**
    Handler for messages from workers.

    @method onMessage
    @param {Object} msg
        @param {String} evt
        @param {Number} id
    @protected
    **/
    onMessage: function (msg) {
        var evt = msg && msg.evt;
        if (evt === 'ready') {
            this.readied += 1;
            if (this.readied === this.options.workers) {
                this.runQueue();
            }
        } else if (evt === 'drain') {
            this.emit('drain', msg.id);
        } else {
            console.error(msg);
        }
    },

    _getDestinationPath: function (file) {
        var cssPath = file.replace(this.options.directory, '').replace(/\.less$/, '.css');
        return path.join(this.options.outputdir, cssPath);
    },

    /**
    Convert absolute dirpath into relative fragment

    @method _getRelativePath
    @param {String} dir
    @return {String}
    @private
    **/
    _getRelativePath: function (dir) {
        return path.relative(process.cwd(), dir);
    },

    /**
    Create pattern for glob

    @method _getGlobPattern
    @param {String} dir
    @return {String}
    @private
    **/
    _getGlobPattern: function (dir) {
        // return path.join(this._getRelativePath(dir), this.options.match);
        return path.join(dir, this.options.match);
    },

    /**
    Ensure file always has .less extension.

    @method _getLessExtension
    @param {String} file
    @return {String} always with .less extension
    @private
    **/
    _getLessExtension: function (file) {
        return path.join(path.dirname(file), path.basename(file, '.less') + '.less');
    },

    /**
    Removes *.css imports from filtered array.

    @method _filterCSSImports
    @param {String} file
    @return {Boolean} false if the file's extension is '.css'
    @private
    **/
    _filterCSSImports: function (file) {
        return path.extname(file) !== '.css';
    },

    /**
    Collect all the things!

    When finished, it caches the contents of the collected files.

    @method collect
    @param {String} [dir]
    @param {Function} [cb]
    **/
    collect: function (dir, cb) {
        var self = this;

        if ("string" !== typeof dir) {
            cb = dir;
            dir = self.options.directory;
        }
        if ("function" !== typeof cb) {
            cb = self._finishCollect.bind(self);
        }

        var fileList = glob(self._getGlobPattern(dir));

        fileList.on('error', function (err) {
            fileList.abort();
            throw err;
        });

        fileList.on('end', function (matches) {
            readFiles(matches, cb);
        });
    },

    /**
    Callback for readFiles after glob's "end" event,
    used by collect() when no other callback passed.

    @method _finishCollect
    @param {Error|null} err
    @param {Object} data
    @private
    **/
    _finishCollect: function (err, data) {
        if (err) {
            throw err;
        }

        var filesToProcess = Object.keys(data);

        // add data to cache
        utils.mix(this._fileData, data);

        // but only operate on added data, not entire cache
        filesToProcess.forEach(this._parseImports, this);

        this.startQueue(filesToProcess);

        // console.log();
        // console.log('Parents (files that import)');
        // console.log(JSON.stringify(this._parents, null, 4));
        // console.log();
        // console.log('Children (files imported elsewhere)');
        // console.log(JSON.stringify(this._children, null, 4));
        // console.log();
    },

    /**
    Iterator used to parse '@import' filenames from collected file data.

    @method _parseImports
    @param {String} fileName
    @private
    **/
    _parseImports: function (fileName) {
        var imports = [];
        var fileContents = this._fileData[fileName];
        var rx = LessCluster.RX_IMPORT;

        // console.log(fileName);

        // avoid non-importing files
        if (rx.test(fileContents)) {
            // reset from test() to avoid losing first match
            rx.lastIndex = 0;

            // cheap way to unique array later
            imports = {};

            // cache dirname to avoid calling every iteration
            var dirName = path.dirname(fileName);

            // loop through captures
            var captured = rx.exec(fileContents);
            while (captured) {
                imports[path.resolve(dirName, captured[1])] = true;
                captured = rx.exec(fileContents);
            }

            // clean up raw hash into sorted unique array
            imports = Object.keys(imports)
                .sort()
                .filter(this._filterCSSImports)
                // .map(this._getRelativePath)
                .map(this._getLessExtension);
        }

        if (imports.length) {
            // always blows away parent record, even for partial runs
            this._parents[fileName] = {};

            var len = imports.length, child, i = 0;
            for (; i < len; i += 1) {
                child = imports[i];

                this._parents[fileName][child] = true;

                if (!this._children.hasOwnProperty(child)) {
                    this._children[child] = {};
                }
                this._children[child][fileName] = true;
            }

            // console.log(JSON.stringify(imports, null, 4));
        }
    }
});
