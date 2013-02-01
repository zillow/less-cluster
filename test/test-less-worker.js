/**
Tests for the worker
**/

var LessWorker = require('../lib/less-worker');

module.exports = {
    "lifecycle": {
        "should instantiate as constructor or factory": function (test) {
            /*jshint newcap: false */
            var instance1 = new LessWorker();
            test.ok(instance1 instanceof LessWorker);

            var instance2 = LessWorker();
            test.ok(instance2 instanceof LessWorker);

            test.done();
        },
        "should not call init() when instantiated manually": function (test) {
            test.expect(1);

            var called = 0;
            var instance = new LessWorker(function () {
                called += 1;
            });

            // the callback passed into the constructor
            // is only called when cluster.isWorker === true
            test.strictEqual(called, 0);

            test.done();
        }
    },

    "methods": {
        "setUp": function (done) {
            this.instance = new LessWorker();

            done();
        },
        "tearDown": function (done) {
            // cleanup after event tests
            process.removeAllListeners();

            this.instance = null;

            done();
        },

        "_applyConfig()": function (test) {
            this.instance._applyConfig({
                'foo': 'bar'
            });

            test.deepEqual(this.instance.options, {
                'foo': 'bar'
            });

            test.done();
        },
        "_attachEvents()": function (test) {
            test.expect(1);

            this.instance._attachEvents(function () {
                // workers listen to events on process
                test.strictEqual(process.listeners('message').length, 1);

                test.done();
            });
        },
        "init()": function (test) {
            test.expect(1);

            this.instance.init(function (err) {
                test.ifError(err);
                test.done();
            });
        },
        "dispatchMessage()": function (test) {
            console.error("TODO");
            test.done();
        }
    }
};
