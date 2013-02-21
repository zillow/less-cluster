/**
Tests for the worker
**/
var assert = require('assert');
var LessWorker = require('../lib/less-worker');

module.exports = {
    "lifecycle": {
        "should instantiate as constructor or factory": function () {
            /*jshint newcap: false */
            var instance1 = new LessWorker();
            assert.ok(instance1 instanceof LessWorker);

            var instance2 = LessWorker();
            assert.ok(instance2 instanceof LessWorker);
        },
        "should not call init() when instantiated manually": function () {
            /*jshint newcap: false */
            var called = 0;
            LessWorker(function () {
                called += 1;
            });

            // the callback passed into the constructor
            // is only called when cluster.isWorker === true
            assert.strictEqual(called, 0);
        }
    },

    "methods": {
        "beforeEach": function (done) {
            this.instance = new LessWorker();

            done();
        },
        "afterEach": function (done) {
            // cleanup after event tests
            process.removeAllListeners();

            this.instance = null;

            done();
        },

        "_applyConfig()": function () {
            var defaults = LessWorker.defaults;

            // missing options object
            this.instance._applyConfig();
            assert.deepEqual(this.instance.options, defaults);

            // options override defaults
            this.instance._applyConfig({
                'lint': true
            });
            assert.strictEqual(this.instance.options.lint, true, "options should override defaults.");
        },
        "_attachEvents()": function (done) {
            this.instance._attachEvents(function () {
                // workers listen to events on process
                assert.strictEqual(process.listeners('message').length, 1);

                done();
            });
        },
        "init()": function (done) {
            this.instance.init(function (err) {
                assert.ifError(err);
                done();
            });
        },
        "dispatchMessage() should receive message object with command": function () {
            var instance = this.instance;

            assert.throws(function () {
                instance.dispatchMessage();
            }, "Message must have command");

            assert.throws(function () {
                instance.dispatchMessage({
                    foo: 'foo'
                });
            }, "Message must have command");
        },
        "dispatchMessage() should distinguish invalid commands": function () {
            var instance = this.instance;

            assert.throws(function () {
                instance.dispatchMessage({
                    cmd: 'missing'
                });
            }, "Message command invalid");
        },
        "dispatchMessage() should execute build command": function (done) {
            var instance = this.instance;

            instance.build = function (msg) {
                assert.deepEqual(msg, {
                    cmd: 'build'
                });

                done();
            };

            assert.doesNotThrow(function () {
                instance.dispatchMessage({
                    cmd: 'build'
                });
            });
        },
        "dispatchMessage() should execute start command": function (done) {
            var instance = this.instance;

            instance.start = function (msg) {
                assert.deepEqual(msg, {
                    cmd: 'start'
                });

                done();
            };

            assert.doesNotThrow(function () {
                instance.dispatchMessage({
                    cmd: 'start'
                });
            });
        },
        "build()": function () {
            // console.error("TODO");
        }
    }
};
