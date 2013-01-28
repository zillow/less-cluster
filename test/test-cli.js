/**
Tests for the cli arguments
**/
var cli = require('../lib/cli');

module.exports = {
    setUp: function (cb) {
        cb();
    },
    tearDown: function (cb) {
        cb();
    },

    "should write tests": function (test) {
        test.ok(false, "Really should write them.");
        test.done();
    }
};
