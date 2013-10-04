/**
Tests for the main class
**/
var assert = require('assert');
var vows = require('vows');
var path = require('path');

var LessCluster = require('../');
var Master = LessCluster.Master;

var suite = vows.describe('Master');

suite.addBatch({
    "factory": {
        topic: function () {
            /*jshint newcap: false */
            return Master();
        },
        "should instantiate without 'new'": function (topic) {
            assert.ok(topic instanceof Master);
        }
    },
    "instance": {
        topic: function () {
            return new Master();
        },
        "should instantiate safely with no config": function (topic) {
            assert.ok(topic instanceof Master);
        },
        "should inherit LessCluster": function (topic) {
            assert.ok(Master.super_ === LessCluster);
            assert.ok(topic instanceof LessCluster);
        },
        "should default all options": function (topic) {
            assert.ok(topic.hasOwnProperty('options'));

            assert.strictEqual(topic.options.match, '**/*.less');
            assert.strictEqual(topic.options.workers, require('os').cpus().length);
        },
        "should setup private caches": function (topic) {
            assert.ok(topic.hasOwnProperty('_parents'));
            assert.ok(topic.hasOwnProperty('_children'));
            assert.ok(topic.hasOwnProperty('_fileData'));

            assert.deepEqual(topic._parents, {});
            assert.deepEqual(topic._children, {});
            assert.deepEqual(topic._fileData, {});
        },
        "destroy()": {
            topic: function () {
                var instance = new Master();

                instance._detachEvents = function () {
                    this.callback(true);
                };

                instance.destroy();
            },
            "should call _detachEvents": function (topic) {
                assert.ok(topic);
            }
        }
    }
});

suite.addBatch({
    "forkWorkers()": {
        topic: function () {
            var instance = new Master({
                workers: 0
            });

            instance.forkWorkers(this.callback);
        },
        "should execute provided callback": function (err) {
            assert.ifError(err);
        }
    }
});

suite.addBatch({
    "run()": {
        "should call collect() without arguments": function () {
            var instance = new Master({ workers: 0 });

            instance.setupMaster = function () {};
            instance.collect = function () {
                assert.strictEqual(arguments.length, 0);
            };

            instance.run();
        },
        "should call setupMaster() with exec path": function () {
            var instance = new Master({ workers: 0 });

            instance.setupMaster = function (options) {
                assert.deepEqual(options, {
                    exec: path.resolve(__dirname, '../lib/worker.js')
                });
            };
            instance.collect = function () {};

            instance.run();
        },
        "_attachEvents() should fire after cluster.setupMaster()": function () {
            var instance = new Master({ workers: 0 });

            instance._attachEvents = function () {
                assert.ok(true);
            };

            instance.setupMaster();
        }
    }
});

suite["export"](module);
