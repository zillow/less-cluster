/**
Tests for the logger mixin
**/
var vows = require('vows');

var Logger = require('../lib/logger');

vows.describe('Logger').addBatch({
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
