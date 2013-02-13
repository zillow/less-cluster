/**
Worker process that actually compiles the LESS.
**/

var cluster = require('cluster');
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

LessWorker.create = function (argv) {
    if ("undefined" === typeof argv) {
        argv = process.argv;
    }
    var options = require('./cli').parse(argv);
    // TODO: default checks?
    return new LessWorker(options);
};

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
    },
    _applyConfig: function (options) {
        this.options = utils.merge(this.options, options);
    },
    _attachEvents: function (cb) {
        process.on('message', this.dispatchMessage.bind(this));

        if (cb) {
            cb();
        }
    },
    sendMaster: function (evt) {
        process.send({ evt: evt, id: cluster.worker.id });
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
    build: function (msg) {
        var file = msg.file,
            data = this._fileData[file],
            parser = this._parser;

        console.log('building ' + file);

        // set parser filename
        // update parser contents with data
        // pass cached file data to parser.parse()

        // TODO: call inside nested callback
        this.sendMaster('drain');
    },
    _readFinished: function (err, data) {
        if (err) {
            this.sendMaster('error');
            return;
        }

        // add data to cache
        utils.mix(this._fileData, data);

        // TODO: create parser, then emit
        this.sendMaster('ready');
    },
    start: function (msg) {
        console.log('worker[' + cluster.worker.id + '] started');

        readFiles(msg.data, this._readFinished.bind(this));
    }
};

if (cluster.isWorker) {
    cluster.worker.instance = LessWorker.create();
}
