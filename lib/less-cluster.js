/**
less-cluster provides a wrapper around a less.Parser,
making it smarter about directories and parallel execution.
**/

var glob = require('glob');
var path = require('path');
var cluster = require('cluster');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var utils = require('./utils');
var readFiles = require('./read-files');
var Logger = require('./logger');

module.exports = LessCluster;

inherits(LessCluster, EventEmitter);
Logger.mixin(LessCluster);

/**
Make the LESS compiler faster with large batches.

@class LessCluster
@constructor
@extends EventEmitter
@mixin Logger
**/
function LessCluster(config) {
    // factory constructor
    if (!(this instanceof LessCluster)) {
        return new LessCluster(config);
    }

    // merge config with defaults, running guards
    var options = this.options = LessCluster.checkArguments(config);

    EventEmitter.call(this);
    Logger.call(this, options);

    // seed dependency graph(s)
    this._parents = {};
    this._children = {};
    this._fileData = {};
}

LessCluster.defaults = require('./cli').masterDefaults;

LessCluster.checkArguments = function (config) {
    var options = utils.merge(LessCluster.defaults, config);

    // default outputdir to directory
    if (!options.outputdir) {
        // options.directory always has a default
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
LessCluster.RX_IMPORT = /^\s*\@import\s+(?:\(less\)\s+)?["'](.+)['"](?:\s*[^;]*);/gm;

/**
Start the ball rolling.

@method run
**/
LessCluster.prototype.run = function () {
    if (cluster.isMaster) {
        this.setupMaster({
            exec: __dirname + '/less-worker.js'
        });
        this.forkWorkers(this.collect.bind(this));
    }
};

/**
Destroy all workers and clean up event listeners.

@method destroy
@param {Number} [code] Exit code
**/
LessCluster.prototype.destroy = function (code) {
    this._detachEvents();
    if (code) {
        process.exit(code);
    }
};

/**
Pass options to cluster.setupMaster().

@method setupMaster
@param {Object} options
@protected
**/
LessCluster.prototype.setupMaster = function (options) {
    cluster.on('setup', this._attachEvents.bind(this));
    cluster.setupMaster(options);
};

/**
Attach listeners to cluster lifecycle events.

@method _attachEvents
@private
**/
LessCluster.prototype._attachEvents = function () {
    this._bindProcess();
    this._bindCluster();
    this._bindWorkers();
};

/**
Detach listeners from cluster lifecycle events.

@method _detachEvents
@private
**/
LessCluster.prototype._detachEvents = function () {
    process.removeAllListeners();
    cluster.removeAllListeners();
    this.removeAllListeners();
};

/**
Utility method that hooks various cluster master events.

@method _bindCluster
@private
**/
LessCluster.prototype._bindCluster = function () {
    cluster.on('fork',          this._workerForked.bind(this));
    cluster.on('online',        this._workerOnline.bind(this));
    cluster.on('disconnect',    this._workerDisconnected.bind(this));
    cluster.on('exit',          this._workerExited.bind(this));
};

/**
Utility method that hooks master process signals.

@method _bindProcess
@private
**/
LessCluster.prototype._bindProcess = function () {
    var boundGraceful = this._shutdownGraceful.bind(this);

    process.on('SIGINT',  boundGraceful);
    process.on('SIGTERM', boundGraceful);
};

/**
Utility method that sets up listeners for events emitted by
the master class, such as "drain" and "empty".

@method _bindWorkers
@private
**/
LessCluster.prototype._bindWorkers = function () {
    this.on('drain', this.onDrain);
    this.on('empty', this.onEmpty);
    this.on('finished', this._shutdownGraceful);
};

/**
Disconnect all workers and destroy self, gracefully.

@method _shutdownGraceful
@param {Number} [code] Exit code
@private
**/
LessCluster.prototype._shutdownGraceful = function (code) {
    cluster.disconnect(this.destroy.bind(this, code));
};

/**
Handler for cluster "fork" event, currently a no-op.

@method _workerForked
@param {Worker} worker
@private
**/
LessCluster.prototype._workerForked = function (worker) {
    this.debug('worker[' + worker.id + '] forked.');
};

/**
Handler for cluster "online" event.
Sets up communication between master and worker.

@method _workerOnline
@param {Worker} worker
@private
**/
LessCluster.prototype._workerOnline = function (worker) {
    this.debug('worker[' + worker.id + '] online.');
    worker.on('message', this.onMessage.bind(this));
};

/**
Handler for cluster "disconnect" event, currently a no-op.

@method _workerDisconnected
@param {Worker} worker
@private
**/
LessCluster.prototype._workerDisconnected = function (worker) {
    this.debug('worker[' + worker.id + '] disconnected.');
};

/**
Handler for cluster "exit" event.
If the worker did not suicide, a replacement will be spawned.

@method _workerExited
@param {Worker} worker
@param {Number} code
@param {Number} signal
@private
**/
LessCluster.prototype._workerExited = function (worker, code, signal) {
    this.debug('worker[' + worker.id + '] exited.');

    if (!worker.suicide) {
        // oh noes!
        this.warn('worker[' + worker.id + '] did not suicide. Respawning...');
        cluster.fork();
    }
};

/**
Send an object payload to each worker.

@method sendWorkers
@param {Object} payload
**/
LessCluster.prototype.sendWorkers = function (payload) {
    Object.keys(cluster.workers).forEach(function (id) {
        cluster.workers[id].send(payload);
    });
};

/**
Fork and setup event listeners for all workers.

@method forkWorkers
@param {Function} [cb]
@protected
**/
LessCluster.prototype.forkWorkers = function (cb) {
    var i = 0, numWorkers = this.options.workers;
    for (; i < numWorkers; i += 1) {
        cluster.fork();
    }

    if (cb) {
        cb();
    }
};

/**
Get a filename off the stack.

@method getNextFile
@return {String|Boolean} the next filename, or false if none remain
**/
LessCluster.prototype.getNextFile = function () {
    return this.filesToProcess.length && this.filesToProcess.shift();
};

/**
Sets instance properties and sends 'start' command to all workers.

The workers will read all the files indicated into their cache,
and then reply "ready" and wait for build commands from the list
of files to process.

@method _startWorkers
@param {Array} filesToProcess
@param {Array} [filesToRead]
@private
**/
LessCluster.prototype._startWorkers = function (filesToProcess, filesToRead) {
    this.filesToProcess = filesToProcess;
    this.readied = 0;
    this.sendWorkers({
        cmd: 'start',
        data: filesToRead || filesToProcess
    });
};

/**
If no batch is running, it begins a new batch of files to process.
Otherwise, wait for the current batch to finish before restarting.

@method startQueue
@param {Array} filesToProcess A list of files to compile
@param {Array} [filesToRead]  A list of files to read into cache,
    which may differ from the list of compile targets (imports).
    If not provided, filesToRead defaults to filesToProcess.
**/
LessCluster.prototype.startQueue = function (filesToProcess, filesToRead) {
    if (!this.running) {
        // prepare workers to process files
        this._startWorkers(filesToProcess, filesToRead);
    } else {
        // enqueue after current batch finished
        this.once('finished', this._startWorkers.bind(this, filesToProcess, filesToRead));
    }
};

/**
Send a filename to the designated worker to be built.

@method buildFile
@param {Number} id of worker
@param {String} fileName
**/
LessCluster.prototype.buildFile = function (id, fileName) {
    var worker = cluster.workers[id];
    if (worker && fileName) {
        worker.send({
            cmd: 'build',
            dest: this._getDestinationPath(fileName),
            file: fileName
        });
    }
};

/**
Iterator for runQueue loop over workers. Each file succesfully
passed to buildFile increments `running` instance property.

@method _enqueueWorker
@param {Number} id
@private
**/
LessCluster.prototype._enqueueWorker = function (id) {
    var fileName = this.getNextFile();
    if (fileName) {
        this.buildFile(id, fileName);
        this.running += 1;
    }
};

/**
Run the queue after all the workers have responded "ready", resetting
instance property `running` to zero.

@method runQueue
**/
LessCluster.prototype.runQueue = function () {
    this.running = 0;
    Object.keys(cluster.workers).forEach(this._enqueueWorker.bind(this));
};

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
LessCluster.prototype.onDrain = function (id) {
    var fileName = this.getNextFile();
    if (fileName) {
        this.buildFile(id, fileName);
    } else {
        this.emit('empty', id);
    }
};

/**
Listener for master's 'empty' event, which is emitted inside onDrain
when a worker reaches the end of the filesToProcess list.

When all running workers have emptied, it emits 'finished'.

@method onEmpty
@param {Number} id
@protected
**/
LessCluster.prototype.onEmpty = function (id) {
    this.debug('worker[' + id + '] finished');
    if (--this.running === 0) {
        this.emit('finished');
    }
};

/**
Handler for messages from workers.

@method onMessage
@param {Object} msg
    @param {String} evt
    @param {Number} id
@protected
**/
LessCluster.prototype.onMessage = function (msg) {
    var evt = msg && msg.evt;
    if (evt === 'ready') {
        this.readied += 1;
        if (this.readied === this.options.workers) {
            this.runQueue();
        }
    } else if (evt === 'drain') {
        this.emit('drain', msg.id);
    } else if (evt === 'error') {
        // error has already output in worker
        this._shutdownGraceful(1);
    } else {
        this.error(msg);
    }
};

LessCluster.prototype._getDestinationPath = function (file) {
    var cssPath = file.replace(this.options.directory, '').replace(/\.less$/, '.css');
    return path.join(this.options.outputdir, cssPath);
};

/**
Convert absolute dirpath into relative fragment

@method _getRelativePath
@param {String} dir
@return {String}
@private
**/
LessCluster.prototype._getRelativePath = function (dir) {
    return path.relative(process.cwd(), dir);
};

/**
Create pattern for glob

@method _getGlobPattern
@param {String} dir
@return {String}
@private
**/
LessCluster.prototype._getGlobPattern = function (dir) {
    // return path.join(this._getRelativePath(dir), this.options.match);
    return path.join(dir, this.options.match);
};

/**
Ensure file always has .less extension.

@method _getLessExtension
@param {String} file
@return {String} always with .less extension
@private
**/
LessCluster.prototype._getLessExtension = function (file) {
    return path.join(path.dirname(file), path.basename(file, '.less') + '.less');
};

/**
Removes *.css imports from filtered array.

@method _filterCSSImports
@param {String} file
@return {Boolean} false if the file's extension is '.css'
@private
**/
LessCluster.prototype._filterCSSImports = function (file) {
    return path.extname(file) !== '.css';
};

/**
Collect all the things!

When finished, it caches the contents of the collected files.

@method collect
@param {String} [dir]
@param {Function} [cb]
**/
LessCluster.prototype.collect = function (dir, cb) {
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
};

/**
For any ad-hoc files passed after directory and outputdir,
restrict the operations to those files (and their dependency
graph).

This overrides the filesToProcess array derived from the
data passed to the _finishCollect method.

@method _filterAdHocFiles
@param {String[]} adHocFiles
@return {String[]} sorted array of file paths
@private
**/
LessCluster.prototype._filterAdHocFiles = function (adHocFiles) {
    var memo = {},
        mix = utils.mix,
        parents = this._parents,
        children = this._children,

        visitParents = function (node) {
            if (node in parents) {
                mix(memo, parents[node]);
                Object.keys(parents[node]).forEach(visitParents);
            }
        },

        i = 0,
        len = adHocFiles.length,
        file;

    for (; i < len; i += 1) {
        file = adHocFiles[i];

        if (file in children) {
            // file is imported elsewhere
            mix(memo, children[file]);

            Object.keys(children[file]).forEach(visitParents);
        } else if (file in parents) {
            // file imports other files
            mix(memo, parents[file]);

            Object.keys(parents[file]).forEach(visitParents);
        }

        // always read adHocFiles
        memo[file] = true;
    }

    return Object.keys(memo).sort();
};

/**
Callback for readFiles after glob's "end" event,
used by collect() when no other callback passed.

@method _finishCollect
@param {Error|null} err
@param {Object} data
@private
**/
LessCluster.prototype._finishCollect = function (err, data) {
    if (err) {
        throw err;
    }

    var filesToRead = Object.keys(data);
    var filesToProcess = this.options._files;

    // add data to cache
    utils.mix(this._fileData, data);

    // but only operate on added data, not entire cache
    filesToRead.forEach(this._parseImports, this);

    // individual files passed will filter the list
    if (filesToProcess) {
        filesToRead = this._filterAdHocFiles(filesToProcess);
    } else {
        // otherwise, process all files read
        filesToProcess = filesToRead;
    }

    // this.debug()
    // this.debug('filesToProcess (%d)', filesToProcess.length)
    // this.debug(filesToProcess)
    // this.debug()
    // this.debug('filesToRead (%d)', filesToRead.length)
    // this.debug(filesToRead)

    this.startQueue(filesToProcess, filesToRead);

    // this.debug();
    // this.debug('Parents (files that import)');
    // this.debug(JSON.stringify(this._parents, null, 4));
    // this.debug();
    // this.debug('Children (files imported elsewhere)');
    // this.debug(JSON.stringify(this._children, null, 4));
    // this.debug();
};

/**
Iterator used to parse '@import' filenames from collected file data.

@method _parseImports
@param {String} fileName
@private
**/
LessCluster.prototype._parseImports = function (fileName) {
    var imports = [];
    var fileContents = this._fileData[fileName];
    var rx = LessCluster.RX_IMPORT;

    // this.debug(fileName);

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

        // this.debug(JSON.stringify(imports, null, 4));
    }
};
