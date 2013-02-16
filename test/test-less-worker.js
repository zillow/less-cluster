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
            /*jshint newcap: false */
            test.expect(1);

            var called = 0;
            LessWorker(function () {
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
            var defaults = LessWorker.defaults;

            // missing options object
            this.instance._applyConfig();
            test.deepEqual(this.instance.options, defaults);

            // options override defaults
            this.instance._applyConfig({
                'lint': true
            });
            test.strictEqual(this.instance.options.lint, true, "options should override defaults.");

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
        "dispatchMessage() should receive message object with command": function (test) {
            test.expect(2);

            var instance = this.instance;

            test.throws(function () {
                instance.dispatchMessage();
            }, "Message must have command");

            test.throws(function () {
                instance.dispatchMessage({
                    foo: 'foo'
                });
            }, "Message must have command");

            test.done();
        },
        "dispatchMessage() should distinguish invalid commands": function (test) {
            test.expect(1);

            var instance = this.instance;

            test.throws(function () {
                instance.dispatchMessage({
                    cmd: 'missing'
                });
            }, "Message command invalid");

            test.done();
        },
        "dispatchMessage() should execute build command": function (test) {
            test.expect(1);

            var instance = this.instance;

            instance.build = function (msg) {
                test.deepEqual(msg, {
                    cmd: 'build'
                });

                test.done();
            };

            test.doesNotThrow(function () {
                instance.dispatchMessage({
                    cmd: 'build'
                });
            });
        },
        "dispatchMessage() should execute start command": function (test) {
            test.expect(1);

            var instance = this.instance;

            instance.start = function (msg) {
                test.deepEqual(msg, {
                    cmd: 'start'
                });

                test.done();
            };

            test.doesNotThrow(function () {
                instance.dispatchMessage({
                    cmd: 'start'
                });
            });
        },
        "build()": function (test) {
            console.error("TODO");
            test.done();
        }
    }
};
