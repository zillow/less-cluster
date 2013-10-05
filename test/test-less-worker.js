/**
Tests for the worker
**/
var assert = require('assert');
var vows = require('vows');

var LessWorker = require('../lib/less-worker');

vows.describe('LessWorker').addBatch({
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
        "build()": function () {
            // console.error("TODO");
        }
    }
})["export"](module);
