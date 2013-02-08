/**
Worker process that actually compiles the LESS.
**/

var cluster = require('cluster');
var utils = require('./utils');

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

    if (cluster.isWorker) {
        this.init(options, cb);
    }
};

LessWorker.start = function (argv) {
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
    dispatchMessage: function (msg) {
        if (!msg || !msg.hasOwnProperty('cmd')) {
            throw "Message must have command";
        }

        var cmd = msg.cmd;
        if (cmd === 'build') {
            this.build(msg);
        } else {
            throw "Message command invalid";
        }
    }
};

if (cluster.isWorker) {
    cluster.worker.instance = LessWorker.start();
}
