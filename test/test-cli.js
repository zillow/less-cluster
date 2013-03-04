/**
Tests for the cli arguments
**/
var assert = require('assert');
var vows = require('vows');
var path = require('path');

var cli = require('../lib/cli');
var knownOpts = cli.knownOpts;
var shortHands = cli.shortHands;

// used in parsing tests
var rootDir = 'fixtures/cli/';

var suite = vows.describe('CLI');

suite.addBatch({
    "master options": {
        "default properties": function () {
            var masterDefaults = cli.masterDefaults;

            assert.ok(masterDefaults.hasOwnProperty('directory'), "should have 'directory' property.");
            assert.ok(masterDefaults.hasOwnProperty('match'), "should have 'match' property.");
            assert.ok(masterDefaults.hasOwnProperty('workers'), "should have 'workers' property.");

            assert.equal(Object.keys(masterDefaults).length, 3, "should only have expected properties.");
        },
        "default values": function () {
            assert.strictEqual(cli.MAX_WORKERS, 8, "MAX_WORKERS should be 8.");

            assert.deepEqual(cli.masterDefaults, {
                directory   : process.cwd(),
                match       : '**/*.less',
                workers     : Math.min(require('os').cpus().length, cli.MAX_WORKERS)
            });
        },
        "directory": function () {
            assert.ok(knownOpts.hasOwnProperty('directory'), "--directory option should be provided.");
            assert.strictEqual(knownOpts.directory, path, "--directory should be a path.");

            assert.ok(shortHands.hasOwnProperty('d'), "-d alias should be provided.");
            assert.strictEqual(shortHands.d[0], '--directory', "-d should alias --directory.");
        },
        "outputdir": function () {
            assert.ok(knownOpts.hasOwnProperty('outputdir'), "--outputdir option should be provided.");
            assert.strictEqual(knownOpts.outputdir, path, "--outputdir should be a path.");

            assert.ok(shortHands.hasOwnProperty('o'), "-o alias should be provided.");
            assert.strictEqual(shortHands.o[0], '--outputdir', "-o should alias --outputdir.");
        },
        "match": function () {
            assert.ok(knownOpts.hasOwnProperty('match'), "--match option should be provided.");
            assert.strictEqual(knownOpts.match, String, "--match should be a String.");

            assert.ok(shortHands.hasOwnProperty('m'), "-m alias should be provided.");
            assert.strictEqual(shortHands.m[0], '--match', "-m should alias --match.");
        },
        "workers": function () {
            assert.ok(knownOpts.hasOwnProperty('workers'), "--workers option should be provided.");
            assert.strictEqual(knownOpts.workers, Number, "--workers should be a Number.");

            assert.ok(shortHands.hasOwnProperty('w'), "-w alias should be provided.");
            assert.strictEqual(shortHands.w[0], '--workers', "-w should alias --workers.");
        }
    }
});

suite.addBatch({
    "worker options": {
        "default properties": function () {
            var workerDefaults = cli.workerDefaults;

            assert.ok(workerDefaults.hasOwnProperty('paths'), "should have 'paths' property.");
            assert.ok(workerDefaults.hasOwnProperty('optimization'), "should have 'optimization' property.");
            assert.ok(workerDefaults.hasOwnProperty('rootpath'), "should have 'rootpath' property.");
            assert.ok(workerDefaults.hasOwnProperty('relativeUrls'), "should have 'relativeUrls' property.");
            assert.ok(workerDefaults.hasOwnProperty('color'), "should have 'color' property.");
            assert.ok(workerDefaults.hasOwnProperty('compress'), "should have 'compress' property.");
            assert.ok(workerDefaults.hasOwnProperty('yuicompress'), "should have 'yuicompress' property.");
            assert.ok(workerDefaults.hasOwnProperty('dumpLineNumbers'), "should have 'dumpLineNumbers' property.");
            assert.ok(workerDefaults.hasOwnProperty('lint'), "should have 'lint' property.");
            assert.ok(workerDefaults.hasOwnProperty('strictImports'), "should have 'strictImports' property.");
            assert.ok(workerDefaults.hasOwnProperty('strictMaths'), "should have 'strictMaths' property.");
            assert.ok(workerDefaults.hasOwnProperty('strictUnits'), "should have 'strictUnits' property.");
            assert.ok(workerDefaults.hasOwnProperty('ieCompat'), "should have 'ieCompat' property.");
            assert.ok(workerDefaults.hasOwnProperty('silent'), "should have 'silent' property.");
            assert.ok(workerDefaults.hasOwnProperty('verbose'), "should have 'verbose' property.");

            assert.equal(Object.keys(workerDefaults).length, 15, "should not have unexpected properties.");
        },
        "default values": function () {
            assert.deepEqual(cli.workerDefaults, {
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
                ieCompat        : true,
                silent          : false,
                verbose         : false
            });
        },
        "paths": function () {
            assert.ok(knownOpts.hasOwnProperty('paths'), "--paths option should be provided.");
            assert.deepEqual(knownOpts.paths, [path, Array], "--paths should be an array of paths.");

            assert.ok(shortHands.hasOwnProperty('I'), "-I alias should be provided.");
            assert.strictEqual(shortHands.I[0], '--paths', "-I should alias --paths.");

            // dash-case to camelCase
            assert.ok(shortHands.hasOwnProperty('include-path'), "--include-path alias should be provided.");
            assert.strictEqual(shortHands['include-path'][0], '--paths', "--include-path should alias --paths.");
        },
        "optimization": function () {
            assert.ok(knownOpts.hasOwnProperty('optimization'), "--optimization option should be provided.");
            assert.deepEqual(knownOpts.optimization, [0,1,2], "--optimization should be [0,1,2].");

            assert.ok(shortHands.hasOwnProperty('O'), "-O alias should be provided.");
            assert.strictEqual(shortHands.O[0], '--optimization', "-O should alias --optimization.");
        },
        "rootpath": function () {
            assert.ok(knownOpts.hasOwnProperty('rootpath'), "--rootpath option should be provided.");
            assert.strictEqual(knownOpts.rootpath, String, "--rootpath should be a String.");

            assert.ok(shortHands.hasOwnProperty('rp'), "-rp alias should be provided.");
            assert.strictEqual(shortHands.rp[0], '--rootpath', "-rp should alias --rootpath.");
        },
        "relativeUrls": function () {
            assert.ok(knownOpts.hasOwnProperty('relativeUrls'), "--relativeUrls option should be provided.");
            assert.strictEqual(knownOpts.relativeUrls, Boolean, "--relativeUrls should be Boolean.");

            assert.ok(shortHands.hasOwnProperty('ru'), "-ru alias should be provided.");
            assert.strictEqual(shortHands.ru[0], '--relativeUrls', "-ru should alias --relativeUrls.");

            // dash-case to camelCase
            assert.ok(shortHands.hasOwnProperty('relative-urls'), "--relative-urls alias should be provided.");
            assert.strictEqual(shortHands['relative-urls'][0], '--relativeUrls', "--relative-urls should alias --relativeUrls.");
        },
        "color": function () {
            assert.ok(knownOpts.hasOwnProperty('color'), "--color option should be provided.");
            assert.strictEqual(knownOpts.color, Boolean, "--color should be Boolean.");

            // no shorthand for --color
        },
        "compress": function () {
            assert.ok(knownOpts.hasOwnProperty('compress'), "--compress option should be provided.");
            assert.strictEqual(knownOpts.compress, Boolean, "--compress should be Boolean.");

            assert.ok(shortHands.hasOwnProperty('x'), "-x alias should be provided.");
            assert.strictEqual(shortHands.x[0], '--compress', "-x should alias --compress.");
        },
        "yuicompress": function () {
            assert.ok(knownOpts.hasOwnProperty('yuicompress'), "--yuicompress option should be provided.");
            assert.strictEqual(knownOpts.yuicompress, Boolean, "--yuicompress should be Boolean.");

            // no shorthand yuicompress

            // dash-case to camelCase
            assert.ok(shortHands.hasOwnProperty('yui-compress'), "--yui-compress alias should be provided.");
            assert.strictEqual(shortHands['yui-compress'][0], '--yuicompress', "--yui-compress should alias --yuicompress.");
        },
        "dumpLineNumbers": function () {
            assert.ok(knownOpts.hasOwnProperty('dumpLineNumbers'), "--dumpLineNumbers option should be provided.");
            assert.deepEqual(knownOpts.dumpLineNumbers, ['comments', 'mediaquery', 'all'], "--dumpLineNumbers should be ['comments', 'mediaquery', 'all'].");

            // no shorthand dumpLineNumbers

            // dash-case to camelCase
            assert.ok(shortHands.hasOwnProperty('line-numbers'), "--line-numbers alias should be provided.");
            assert.strictEqual(shortHands['line-numbers'][0], '--dumpLineNumbers', "--line-numbers should alias --dumpLineNumbers.");
        },
        "lint": function () {
            assert.ok(knownOpts.hasOwnProperty('lint'), "--lint option should be provided.");
            assert.strictEqual(knownOpts.lint, Boolean, "--lint should be Boolean.");

            assert.ok(shortHands.hasOwnProperty('l'), "-l alias should be provided.");
            assert.strictEqual(shortHands.l[0], '--lint', "-l should alias --lint.");
        },
        "strictImports": function () {
            assert.ok(knownOpts.hasOwnProperty('strictImports'), "--strictImports option should be provided.");
            assert.strictEqual(knownOpts.strictImports, Boolean, "--strictImports should be Boolean.");

            // no shorthand --strictImports

            // dash-case to camelCase
            assert.ok(shortHands.hasOwnProperty('strict-imports'), "--strict-imports alias should be provided.");
            assert.strictEqual(shortHands['strict-imports'][0], '--strictImports', "--strict-imports should alias --strictImports.");
        },
        "strictMaths": function () {
            assert.ok(knownOpts.hasOwnProperty('strictMaths'), "--strictMaths option should be provided.");
            assert.strictEqual(knownOpts.strictMaths, Boolean, "--strictMaths should be Boolean.");

            // no shorthand --strictMaths
            // assert.ok(shortHands.hasOwnProperty('sm'), "-sm alias should be provided.");
            // assert.strictEqual(shortHands.sm[0], '--strictMaths', "-sm should alias --strictMaths.");

            // dash-case to camelCase
            assert.ok(shortHands.hasOwnProperty('strict-maths'), "--strict-maths alias should be provided.");
            assert.strictEqual(shortHands['strict-maths'][0], '--strictMaths', "--strict-maths should alias --strictMaths.");
        },
        "strictUnits": function () {
            assert.ok(knownOpts.hasOwnProperty('strictUnits'), "--strictUnits option should be provided.");
            assert.strictEqual(knownOpts.strictUnits, Boolean, "--strictUnits should be Boolean.");

            // no shorthand --strictUnits
            // assert.ok(shortHands.hasOwnProperty('su'), "-su alias should be provided.");
            // assert.strictEqual(shortHands.su[0], '--strictUnits', "-su should alias --strictUnits.");

            // dash-case to camelCase
            assert.ok(shortHands.hasOwnProperty('strict-units'), "--strict-units alias should be provided.");
            assert.strictEqual(shortHands['strict-units'][0], '--strictUnits', "--strict-units should alias --strictUnits.");
        },
        "silent": function () {
            assert.ok(knownOpts.hasOwnProperty('silent'), "--silent option should be provided.");
            assert.strictEqual(knownOpts.silent, Boolean, "--silent should be Boolean.");

            assert.ok(shortHands.hasOwnProperty('s'), "-s alias should be provided.");
            assert.strictEqual(shortHands.s[0], '--silent', "-s should alias --silent.");
        },
        "verbose": function () {
            assert.ok(knownOpts.hasOwnProperty('verbose'), "--verbose option should be provided.");
            assert.strictEqual(knownOpts.verbose, Boolean, "--verbose should be Boolean.");

            assert.ok(shortHands.hasOwnProperty('V'), "-V alias should be provided.");
            assert.strictEqual(shortHands.V[0], '--verbose', "-V should alias --verbose.");
        },
        "ieCompat": function () {
            assert.ok(knownOpts.hasOwnProperty('ieCompat'), "--ieCompat option should be provided.");
            assert.strictEqual(knownOpts.ieCompat, Boolean, "--ieCompat should be Boolean.");

            // no shorthand --ieCompat

            // dash-case to camelCase
            assert.ok(shortHands.hasOwnProperty('ie-compat'), "--ie-compat alias should be provided.");
            assert.strictEqual(shortHands['ie-compat'][0], '--ieCompat', "--ie-compat should alias --ieCompat.");

            // dash-case to camelCase negation (nopt doesn't do it automagically)
            assert.ok(shortHands.hasOwnProperty('no-ie-compat'), "--no-ie-compat alias should be provided.");
            assert.strictEqual(shortHands['no-ie-compat'][0], '--no-ieCompat', "--no-ie-compat should alias --no-ieCompat.");
        },
        "legacy": function () {
            // not present in knownOpts

            assert.ok(shortHands.hasOwnProperty('legacy'), "--legacy alias should be provided.");
            assert.deepEqual(shortHands.legacy, ['--no-strictMaths', '--no-strictUnits'], "--legacy should be ['--no-strictMaths', '--no-strictUnits'].");
        }
    }
});

suite.addBatch({
    "cli options": {
        "help": function () {
            assert.ok(knownOpts.hasOwnProperty('help'), "--help option should be provided.");
            assert.strictEqual(knownOpts.help, Boolean, "--help should be Boolean.");

            assert.ok(shortHands.hasOwnProperty('h'), "-h alias should be provided.");
            assert.strictEqual(shortHands.h[0], '--help', "-h should alias --help.");
        },
        "quiet": function () {
            assert.ok(knownOpts.hasOwnProperty('quiet'), "--quiet option should be provided.");
            assert.strictEqual(knownOpts.quiet, Boolean, "--quiet should be Boolean.");

            assert.ok(shortHands.hasOwnProperty('q'), "-q alias should be provided.");
            assert.strictEqual(shortHands.q[0], '--quiet', "-q should alias --quiet.");
        },
        "version": function () {
            assert.ok(knownOpts.hasOwnProperty('version'), "--version option should be provided.");
            assert.strictEqual(knownOpts.version, Boolean, "--version should be Boolean.");

            assert.ok(shortHands.hasOwnProperty('v'), "-v alias should be provided.");
            assert.strictEqual(shortHands.v[0], '--version', "-v should alias --version.");
        }
    }
});

suite.addBatch({
    "parsing": {
        "directory": function () {
            var opts = cli.parse(['node', 'less-cluster', '-d', rootDir]);

            // nopt resolves 'path' types to process.cwd()
            assert.strictEqual(opts.directory, path.resolve(rootDir));
        },
        "directory (implicit)": function () {
            var opts = cli.parse(['node', 'less-cluster', rootDir]);
            var expected = path.resolve(rootDir);

            // nopt resolves 'path' types to process.cwd()
            assert.strictEqual(opts.directory, expected, "A single remaining argument should be interpreted as 'directory', " + expected);
        },
        "outputdir": function () {
            var opts = cli.parse(['node', 'less-cluster', '-o', rootDir]);

            // nopt resolves 'path' types to process.cwd()
            assert.strictEqual(opts.outputdir, path.resolve(rootDir));
        },
        "outputdir (implicit)": function () {
            var opts = cli.parse(['node', 'less-cluster', rootDir, rootDir + 'out']);
            var expected = path.resolve(rootDir + 'out');

            // nopt resolves 'path' types to process.cwd()
            assert.strictEqual(opts.outputdir, expected, "A second remaining argument should be interpreted as 'outputdir', " + expected);
        },
        "paths (single delimited string)": function () {
            assert.strictEqual(cli.PATH_DELIM, (process.platform === 'win32' ? ';' : ':'));

            // each included path is fully-resolved
            var includedPaths = [rootDir, rootDir].map(path.resolve);
            var opts = cli.parse(['node', 'less-cluster', '-I', includedPaths.join(cli.PATH_DELIM)]);

            assert.deepEqual(opts.paths, includedPaths);
        },
        "quiet": function () {
            var opts = cli.parse(['node', 'less-cluster', '--quiet', '--verbose']);

            assert.strictEqual(opts.silent, true, '--quiet should enable --silent');
            assert.strictEqual(opts.verbose, false, '--quiet should disable --verbose');
        }
    }
});

suite.addBatch({
    "usage()": {
        topic: cli._getUsage(),
        "should have content": function (topic) {
            assert.ok(topic);
        }
    },
    "version()": {
        topic: cli._getVersion(),
        "should be obtained from package.json": function (topic) {
            var pack = require('../package.json');
            assert.equal(topic, pack.version);
        }
    },
    "parse()": {
        "called with full argv": {
            topic: cli.parse(['node', 'less-cluster', 'foo']),
            "should use nopt default slice": function (topic) {
                assert.deepEqual(topic.argv.remain, ['foo']);
            }
        },
        "called with custom slice arg": {
            topic: cli.parse(['foo'], 0),
            "should overwrite nopt slice": function (topic) {
                assert.deepEqual(topic.argv.remain, ['foo']);
            }
        }
    }
});

suite["export"](module);
