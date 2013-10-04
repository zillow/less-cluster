/**
Tests for the logger mixin
**/
var assert = require('assert');
var inherits = require('util').inherits;
var vows = require('vows');

var Logger = require('../lib/logger');

vows.describe('Logger').addBatch({
    "##mixin()": {
        topic: function () {
            function Super() {}
            Super.prototype.log = function () {
                this.logged = "super";
            };

            function Klass(options) {
                Super.call(this);
                Logger.call(this, options);
            }

            inherits(Klass, Super);
            Logger.mixin(Klass);

            return {
                Super: Super,
                Klass: Klass
            };
        },
        "should provide all methods": function (topic) {
            var instance = new topic.Klass();
            assert.ok(instance.debug);
            assert.ok(instance.log);
            assert.ok(instance.warn);
            assert.ok(instance.error);
        },
        "should shadow superclass methods": function (topic) {
            var instance = new topic.Klass();
            instance.log();
            assert.strictEqual(instance.logged, undefined);
        }
    },
    "debug()": {
        topic: new Logger(),
        "should NOT emit without --verbose": function (topic) {
            topic.debug("FAIL");
        },
        "when --verbose": {
            topic: new Logger({
                verbose: true
            }),
            "should emit": function (topic) {
                topic.debug("PASS");
            }
        }
    },

    "log()": {
        topic: new Logger(),
        "should emit": function (topic) {
            topic.log("PASS");
        },
        "when --quiet": {
            topic: new Logger({
                quiet: true
            }),
            "should NOT emit": function (topic) {
                topic.log("FAIL");
            }
        }
    },

    "warn()": {
        topic: new Logger(),
        "should emit": function (topic) {
            topic.warn("PASS");
        },
        "when --quiet": {
            topic: new Logger({
                quiet: true
            }),
            "should NOT emit": function (topic) {
                topic.warn("FAIL");
            }
        }
    },

    "error()": {
        topic: new Logger(),
        "should emit": function (topic) {
            topic.error("PASS");
        },
        "when": {
            "--quiet": {
                topic: new Logger({
                    quiet: true
                }),
                "should emit": function (topic) {
                    topic.error("PASS");
                }
            },
            "--silent": {
                topic: new Logger({
                    silent: true
                }),
                "should NOT emit": function (topic) {
                    topic.error("FAIL");
                }
            }
        }
    }
})["export"](module);
