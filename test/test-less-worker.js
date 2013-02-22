/**
Tests for the worker
**/
var assert = require('assert');
var vows = require('vows');

var LessWorker = require('../lib/less-worker');

vows.describe('Worker').addBatch({
    "factory": {
        topic: function () {
            /*jshint newcap: false */
            return LessWorker();
        },
        "should instantiate without 'new'": function (topic) {
            assert.ok(topic instanceof LessWorker);
        }
    },
    "instance": {
        topic: function () {
            return new LessWorker();
        },
        "should instantiate as constructor": function (topic) {
            assert.ok(topic instanceof LessWorker);
        },
        "should set _fileData property to an empty object": function (topic) {
            assert.ok(topic.hasOwnProperty('_fileData'));
            assert.isObject(topic._fileData);
            assert.deepEqual(topic._fileData, {});
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
        topic: function () {
            return new LessWorker();
        },

        "_applyConfig()": function (instance) {
            var defaults = LessWorker.defaults;

            // missing options object
            instance._applyConfig();
            assert.deepEqual(instance.options, defaults);

            // options override defaults
            instance._applyConfig({
                'lint': true
            });
            assert.strictEqual(instance.options.lint, true, "options should override defaults.");
        },
        "_attachEvents()": function (instance) {
            instance._attachEvents(function () {
                // workers listen to events on process
                assert.strictEqual(process.listeners('message').length, 1);
            });
        },
        "init()": function (instance) {
            instance.init(function (err) {
                assert.ifError(err);
            });
            // process.removeAllListeners();
        },
        "dispatchMessage() should receive message object with command": function (instance) {
            assert.throws(function () {
                instance.dispatchMessage();
            }, "Message must have command");

            assert.throws(function () {
                instance.dispatchMessage({
                    foo: 'foo'
                });
            }, "Message must have command");
        },
        "dispatchMessage() should distinguish invalid commands": function (instance) {
            assert.throws(function () {
                instance.dispatchMessage({
                    cmd: 'missing'
                });
            }, "Message command invalid");
        },
        "dispatchMessage() should execute build command": function (instance) {
            instance.build = function (msg) {
                assert.deepEqual(msg, {
                    cmd: 'build'
                });
            };

            assert.doesNotThrow(function () {
                instance.dispatchMessage({
                    cmd: 'build'
                });
            });
        },
        "dispatchMessage() should execute start command": function (instance) {
            instance.start = function (msg) {
                assert.deepEqual(msg, {
                    cmd: 'start'
                });
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
})["export"](module);
