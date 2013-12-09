/**
The Master
**/

var cluster = require('cluster');
var inherits = require('util').inherits;
var LessCluster = require('./less-cluster');

module.exports = Master;

inherits(Master, LessCluster);

/**
Make the LESS compiler faster with large batches.

@class Master
@constructor
@extends LessCluster
**/
function Master(config) {
    if (!(this instanceof Master)) {
        return new Master(config);
    }

    LessCluster.call(this, config);
}

/**
Start the ball rolling.

@method run
**/
Master.prototype.run = function () {
    if (cluster.isMaster) {
        this.setupMaster({
            exec: __dirname + '/worker.js'
        });
        this.forkWorkers(this.collect.bind(this));
    }
};

/**
Destroy all workers and clean up event listeners.

@method destroy
@param {Number} [code] Exit code
**/
Master.prototype.destroy = function (code) {
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
Master.prototype.setupMaster = function (options) {
    cluster.once('setup', this._attachEvents.bind(this));
    cluster.setupMaster(options);
};

/**
Attach listeners to cluster lifecycle events.

@method _attachEvents
@private
**/
Master.prototype._attachEvents = function () {
    this._bindProcess();
    this._bindCluster();
    this._bindWorkers();
};

/**
Detach listeners from cluster lifecycle events.

@method _detachEvents
@private
**/
Master.prototype._detachEvents = function () {
    this.emit('cleanup');
};

/**
Utility method that hooks various cluster master events.

@method _bindCluster
@private
**/
Master.prototype._bindCluster = function () {
    var workerForked        = this._workerForked.bind(this);
    var workerOnline        = this._workerOnline.bind(this);
    var workerDisconnected  = this._workerDisconnected.bind(this);
    var workerExited        = this._workerExited.bind(this);

    cluster.on('fork',          workerForked);
    cluster.on('online',        workerOnline);
    cluster.on('disconnect',    workerDisconnected);
    cluster.on('exit',          workerExited);

    this.once('cleanup', function () {
        cluster.removeListener('fork',          workerForked);
        cluster.removeListener('online',        workerOnline);
        cluster.removeListener('disconnect',    workerDisconnected);
        cluster.removeListener('exit',          workerExited);
    });
};

/**
Utility method that hooks master process signals.

@method _bindProcess
@private
**/
Master.prototype._bindProcess = function () {
    var boundGraceful = this._shutdownGraceful.bind(this);

    process.on('SIGINT',  boundGraceful);
    process.on('SIGTERM', boundGraceful);

    this.once('cleanup', function () {
        process.removeListener('SIGINT',  boundGraceful);
        process.removeListener('SIGTERM', boundGraceful);
    });
};

/**
Utility method that sets up listeners for events emitted by
the master class, such as "drain" and "empty".

@method _bindWorkers
@private
**/
Master.prototype._bindWorkers = function () {
    this.on('drain', this.onDrain);
    this.on('empty', this.onEmpty);
    this.on('finished', this._shutdownGraceful);

    this.once('cleanup', function () {
        this.removeAllListeners('drain');
        this.removeAllListeners('empty');
        this.removeAllListeners('finished');
    });
};

/**
Disconnect all workers and destroy self, gracefully.

@method _shutdownGraceful
@param {Number} [code] Exit code
@private
**/
Master.prototype._shutdownGraceful = function (code) {
    cluster.disconnect(this.destroy.bind(this, code));
};

/**
Handler for cluster "fork" event, currently a no-op.

@method _workerForked
@param {Worker} worker
@private
**/
Master.prototype._workerForked = function (worker) {
    this.debug('worker[' + worker.id + '] forked.');
};

/**
Handler for cluster "online" event.
Sets up communication between master and worker.

@method _workerOnline
@param {Worker} worker
@private
**/
Master.prototype._workerOnline = function (worker) {
    this.debug('worker[' + worker.id + '] online.');
    worker.on('message', this.onMessage.bind(this));
};

/**
Handler for cluster "disconnect" event, currently a no-op.

@method _workerDisconnected
@param {Worker} worker
@private
**/
Master.prototype._workerDisconnected = function (worker) {
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
Master.prototype._workerExited = function (worker, code, signal) {
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
Master.prototype.sendWorkers = function (payload) {
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
Master.prototype.forkWorkers = function (cb) {
    var i = 0, numWorkers = this.options.workers;
    for (; i < numWorkers; i += 1) {
        cluster.fork();
    }

    if (cb) {
        cb();
    }
};

/**
Sets instance properties and sends 'start' command to all workers.

The workers will read all the files indicated into their cache,
and then reply "ready" and wait for build commands from the list
of files to process.

@method _startQueue
@param {Array} filesToProcess
@param {Array} [filesToRead]
@private
@override
**/
Master.prototype._startQueue = function (filesToProcess, filesToRead) {
    this.filesToProcess = filesToProcess;
    this.readied = 0;
    this.sendWorkers({
        cmd: 'start',
        data: filesToRead || filesToProcess
    });
};

/**
Send a filename to the designated worker to be built.

@method buildFile
@param {String} fileName
@param {Number} id of worker
@override
**/
Master.prototype.buildFile = function (fileName, id) {
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
Master.prototype._enqueueWorker = function (id) {
    var fileName = this.getNextFile();
    if (fileName) {
        this.buildFile(fileName, id);
        this.running += 1;
    }
};

/**
Run the queue after all the workers have responded "ready", resetting
instance property `running` to zero.

@method runQueue
**/
Master.prototype.runQueue = function () {
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
@override
**/
Master.prototype.onDrain = function (id) {
    var fileName = this.getNextFile();
    if (fileName) {
        this.buildFile(fileName, id);
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
Master.prototype.onEmpty = function (id) {
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
Master.prototype.onMessage = function (msg) {
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
