/**
The Worker
**/
var cluster = require('cluster');
var inherits = require('util').inherits;
var LessWorker = require('./less-worker');
var utils = require('./utils');

module.exports = Worker;

inherits(Worker, LessWorker);

/**
The worker process for compiling LESS.

@class Worker
@constructor
@extends LessWorker
@param {Object} [options]
**/
function Worker(options) {
    // factory constructor
    if (!(this instanceof Worker)) {
        return new Worker(options);
    }

    LessWorker.call(this, options);

    this._attachEvents();

    if (cluster.isWorker) {
        this._logPrefix = "worker[" + cluster.worker.id + "]";
    }
}

Worker.readFiles = require('./read-files');

Worker.prototype._attachEvents = function () {
    var boundDispatchMessage = this.dispatchMessage.bind(this);
    process.on('message', boundDispatchMessage);

    this.on('drain', function () { this.sendMaster('drain'); });
    this.on('error', function () { this.sendMaster('error'); });
    this.on('ready', function () { this.sendMaster('ready'); });

    this.once('cleanup', function () {
        process.removeListener('message', boundDispatchMessage);
    });
};

Worker.prototype.sendMaster = function (evt) {
    // avoids uncaught exception when the master has disconnected already.
    if (process.connected) {
        process.send({ evt: evt, id: cluster.worker.id });
    }
};

Worker.prototype.dispatchMessage = function (msg) {
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
};

Worker.prototype.build = function (msg) {
    this._build(msg.file, msg.dest);
};

Worker.prototype._readFinished = function (err, data) {
    if (err) {
        this.emit('error', err);
        return;
    }

    this.debug(this._logPrefix, 'finished reading');

    // add data to cache
    utils.mix(this._fileCache, data);

    // tell our master that we are ready
    this.emit('ready');
};

Worker.prototype.start = function (msg) {
    this.debug(this._logPrefix, 'started');

    Worker.readFiles(msg.data, this._readFinished.bind(this));
};

/* istanbul ignore if (all inner cases are handled) */
if (cluster.isWorker) {
    /*jshint newcap: false */
    Worker(require('./cli').parse());
}
