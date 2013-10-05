/**
Tests for the worker
**/
var assert = require('assert');
var vows = require('vows');

var LessCluster = require('../');
var ClusterWorker = LessCluster.Worker;

vows.describe('ClusterWorker').addBatch({
    "factory": {
        topic: function () {
            /*jshint newcap: false */
            return ClusterWorker();
        },
        "should instantiate without 'new'": function (topic) {
            assert.ok(topic instanceof ClusterWorker);
        }
    },
    "instance": {
        topic: function () {
            return new ClusterWorker();
        },
        "should instantiate as constructor": function (topic) {
            assert.ok(topic instanceof ClusterWorker);
        }
    },

    "event handling": {
        topic: new ClusterWorker(),

        "should listen to 'message' on process": function (instance) {
            // workers listen to events on process
            assert.ok(process.listeners('message').length);
        },
        "should pass lifecycle events through to sendMaster": function (instance) {
            // TODO: sinon.js FFS
            var count = 0;
            instance.sendMaster = function () {
                count += 1;
            };

            // 'emit' returns true if there were listeners
            assert.ok(instance.emit('drain'));
            assert.ok(instance.emit('error'));
            assert.ok(instance.emit('ready'));

            assert.strictEqual(count, 3);
        }
    },

    "methods": {
        topic: function () {
            return new ClusterWorker();
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
        }
    }
})["export"](module);
