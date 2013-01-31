/**
Tests for the cli arguments
**/
var path = require('path');

var cli = require('../lib/cli');
var knownOpts = cli.knownOpts;
var shortHands = cli.shortHands;

var rootDir = 'fixtures/cli/';

module.exports = {
    "options": {
        "directory": function (test) {
            test.ok(knownOpts.hasOwnProperty('directory'), "--directory option should be provided.");
            test.ok(knownOpts.directory === path, "--directory should be path.");

            test.ok(shortHands.hasOwnProperty('d'), "-d alias should be provided.");
            test.ok(shortHands.d[0] === '--directory', "-d should alias --directory.");

            test.done();
        },
        "outputdir": function (test) {
            test.ok(knownOpts.hasOwnProperty('outputdir'), "--outputdir option should be provided.");
            test.ok(knownOpts.outputdir === path, "--outputdir should be path.");

            test.ok(shortHands.hasOwnProperty('o'), "-o alias should be provided.");
            test.ok(shortHands.o[0] === '--outputdir', "-o should alias --outputdir.");

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
        "directory": function (test) {
            var opts = cli.parse(['node', 'less-cluster', '-d', rootDir]);

            // nopt resolves 'path' types to process.cwd()
            test.strictEqual(opts.directory, path.resolve(rootDir));

            test.done();
        },
        "outputdir": function (test) {
            var opts = cli.parse(['node', 'less-cluster', '-o', rootDir]);

            // nopt resolves 'path' types to process.cwd()
            test.strictEqual(opts.outputdir, path.resolve(rootDir));

            test.done();
        }
    },

    "methods": {
        "help()": function (test) {
            var help = cli._getUsage();

            test.ok(help, "Usage should have content.");

            test.done();
        },
        "parse() should accept optional slice index": function (test) {
            var parsedDefaultIndex = cli.parse(['node', 'less-cluster', 'foo']);
            var parsedCustomIndex  = cli.parse(['foo'], 0);

            test.deepEqual(parsedDefaultIndex, parsedCustomIndex);

            test.done();
        },
        "version()": function (test) {
            var pack = require('../package.json');

            test.equal(cli._getVersion(), pack.version, "Version should be obtained from package.json");

            test.done();
        }
    }
};
