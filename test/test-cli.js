/**
Tests for the cli arguments
**/
var cli = require('../lib/cli');
var knownOpts = cli.knownOpts;
var shortHands = cli.shortHands;

module.exports = {
    "options": {
        "srcdir": function (test) {
            test.fail('TODO');
            test.done();
        },
        "outdir": function (test) {
            test.fail('TODO');
            test.done();
        },
        "help": function (test) {
            test.ok(knownOpts.hasOwnProperty('help'), "--help option should be provided.");
            test.ok(knownOpts.help === Boolean, "--help should be Boolean.");

            test.ok(shortHands.hasOwnProperty('h'), "-h alias should be provided.");
            test.ok(shortHands.h[0] === '--help', "-h should alias --help.");

            test.done();
        },
        "version": function (test) {
            test.ok(knownOpts.hasOwnProperty('version'), "--version option should be provided.");
            test.ok(knownOpts.version === Boolean, "--version should be Boolean.");

            test.ok(shortHands.hasOwnProperty('v'), "-v alias should be provided.");
            test.ok(shortHands.v[0] === '--version', "-v should alias --version.");

            test.done();
        }
    },

    "parsing": {
        "srcdir": function (test) {
            test.fail('TODO');
            test.done();
        },
        "outdir": function (test) {
            test.fail('TODO');
            test.done();
        }
    },

    "methods": {
        "help()": function (test) {
            var help = cli._getUsage();

            test.ok(help, "Usage should have content.");

            test.done();
        },
        "version()": function (test) {
            var pack = require('../package.json');

            test.equal(cli._getVersion(), pack.version, "Version should be obtained from package.json");

            test.done();
        }
    }
};
