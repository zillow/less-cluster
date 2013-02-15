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

    "defaults": {
        "master properties": function (test) {
            var masterDefaults = cli.masterDefaults;

            test.ok(masterDefaults.hasOwnProperty('directory'), "should have 'directory' property.");
            test.ok(masterDefaults.hasOwnProperty('match'), "should have 'match' property.");
            test.ok(masterDefaults.hasOwnProperty('ignores'), "should have 'ignores' property.");
            test.ok(masterDefaults.hasOwnProperty('workers'), "should have 'workers' property.");

            test.equal(Object.keys(masterDefaults).length, 4, "should not have unexpected properties.");

            test.done();
        },
        "master values": function (test) {
            test.strictEqual(cli.MAX_WORKERS, 8, "MAX_WORKERS should be 8.");

            test.deepEqual(cli.masterDefaults, {
                directory   : process.cwd(),
                match       : '**/*.less',
                ignores     : ['**/_*.less'],
                workers     : Math.min(require('os').cpus().length, cli.MAX_WORKERS)
            });

            test.done();
        },
        "worker properties": function (test) {
            var workerDefaults = cli.workerDefaults;

            test.ok(workerDefaults.hasOwnProperty('paths'), "should have 'paths' property.");
            test.ok(workerDefaults.hasOwnProperty('optimization'), "should have 'optimization' property.");
            test.ok(workerDefaults.hasOwnProperty('rootpath'), "should have 'rootpath' property.");
            test.ok(workerDefaults.hasOwnProperty('relativeUrls'), "should have 'relativeUrls' property.");
            test.ok(workerDefaults.hasOwnProperty('color'), "should have 'color' property.");
            test.ok(workerDefaults.hasOwnProperty('compress'), "should have 'compress' property.");
            test.ok(workerDefaults.hasOwnProperty('yuicompress'), "should have 'yuicompress' property.");
            test.ok(workerDefaults.hasOwnProperty('dumpLineNumbers'), "should have 'dumpLineNumbers' property.");
            test.ok(workerDefaults.hasOwnProperty('lint'), "should have 'lint' property.");
            test.ok(workerDefaults.hasOwnProperty('strictImports'), "should have 'strictImports' property.");
            test.ok(workerDefaults.hasOwnProperty('strictMaths'), "should have 'strictMaths' property.");
            test.ok(workerDefaults.hasOwnProperty('strictUnits'), "should have 'strictUnits' property.");
            test.ok(workerDefaults.hasOwnProperty('silent'), "should have 'silent' property.");
            test.ok(workerDefaults.hasOwnProperty('verbose'), "should have 'verbose' property.");

            test.equal(Object.keys(workerDefaults).length, 14, "should not have unexpected properties.");

            test.done();
        },
        "worker values": function (test) {
            test.deepEqual(cli.workerDefaults, {
                paths           : [],
                optimization    : 1,
                rootpath        : '',
                relativeUrls    : false,
                color           : true,
                compress        : false,
                yuicompress     : false,
                dumpLineNumbers : false,
                lint            : false,
                strictImports   : false,
                strictMaths     : true,
                strictUnits     : true,
                silent          : false,
                verbose         : false
            });

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
        "directory (implicit)": function (test) {
            var opts = cli.parse(['node', 'less-cluster', rootDir]);

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
