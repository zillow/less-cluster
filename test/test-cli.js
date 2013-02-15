/**
Tests for the cli arguments
**/
var path = require('path');

var cli = require('../lib/cli');
var knownOpts = cli.knownOpts;
var shortHands = cli.shortHands;

var rootDir = 'fixtures/cli/';

module.exports = {
    "master options": {
        "default properties": function (test) {
            var masterDefaults = cli.masterDefaults;

            test.ok(masterDefaults.hasOwnProperty('directory'), "should have 'directory' property.");
            test.ok(masterDefaults.hasOwnProperty('match'), "should have 'match' property.");
            test.ok(masterDefaults.hasOwnProperty('ignores'), "should have 'ignores' property.");
            test.ok(masterDefaults.hasOwnProperty('workers'), "should have 'workers' property.");

            test.equal(Object.keys(masterDefaults).length, 4, "should not have unexpected properties.");

            test.done();
        },
        "default values": function (test) {
            test.strictEqual(cli.MAX_WORKERS, 8, "MAX_WORKERS should be 8.");

            test.deepEqual(cli.masterDefaults, {
                directory   : process.cwd(),
                match       : '**/*.less',
                ignores     : ['**/_*.less'],
                workers     : Math.min(require('os').cpus().length, cli.MAX_WORKERS)
            });

            test.done();
        },
        "directory": function (test) {
            test.ok(knownOpts.hasOwnProperty('directory'), "--directory option should be provided.");
            test.strictEqual(knownOpts.directory, path, "--directory should be a path.");

            test.ok(shortHands.hasOwnProperty('d'), "-d alias should be provided.");
            test.strictEqual(shortHands.d[0], '--directory', "-d should alias --directory.");

            test.done();
        },
        "outputdir": function (test) {
            test.ok(knownOpts.hasOwnProperty('outputdir'), "--outputdir option should be provided.");
            test.strictEqual(knownOpts.outputdir, path, "--outputdir should be a path.");

            test.ok(shortHands.hasOwnProperty('o'), "-o alias should be provided.");
            test.strictEqual(shortHands.o[0], '--outputdir', "-o should alias --outputdir.");

            test.done();
        },
        "match": function (test) {
            test.ok(knownOpts.hasOwnProperty('match'), "--match option should be provided.");
            test.strictEqual(knownOpts.match, String, "--match should be a String.");

            test.ok(shortHands.hasOwnProperty('m'), "-m alias should be provided.");
            test.strictEqual(shortHands.m[0], '--match', "-m should alias --match.");

            test.done();
        },
        "ignores": function (test) {
            test.ok(knownOpts.hasOwnProperty('ignores'), "--ignores option should be provided.");
            test.deepEqual(knownOpts.ignores, [String, Array], "--ignores should be an array of strings.");

            test.ok(shortHands.hasOwnProperty('i'), "-i alias should be provided.");
            test.strictEqual(shortHands.i[0], '--ignores', "-i should alias --ignores.");

            test.done();
        },
        "workers": function (test) {
            test.ok(knownOpts.hasOwnProperty('workers'), "--workers option should be provided.");
            test.strictEqual(knownOpts.workers, Number, "--workers should be a Number.");

            test.ok(shortHands.hasOwnProperty('w'), "-w alias should be provided.");
            test.strictEqual(shortHands.w[0], '--workers', "-w should alias --workers.");

            test.done();
        }
    },

    "worker options": {
        "default properties": function (test) {
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
        "default values": function (test) {
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
        },
        "paths": function (test) {
            test.ok(knownOpts.hasOwnProperty('paths'), "--paths option should be provided.");
            test.deepEqual(knownOpts.paths, [path, Array], "--paths should be an array of paths.");

            test.ok(shortHands.hasOwnProperty('I'), "-I alias should be provided.");
            test.strictEqual(shortHands.I[0], '--paths', "-I should alias --paths.");

            // dash-case to camelCase
            test.ok(shortHands.hasOwnProperty('include-path'), "--include-path alias should be provided.");
            test.strictEqual(shortHands['include-path'][0], '--paths', "--include-path should alias --paths.");

            test.done();
        },
        "optimization": function (test) {
            test.ok(knownOpts.hasOwnProperty('optimization'), "--optimization option should be provided.");
            test.deepEqual(knownOpts.optimization, [0,1,2], "--optimization should be [0,1,2].");

            test.ok(shortHands.hasOwnProperty('O'), "-O alias should be provided.");
            test.strictEqual(shortHands.O[0], '--optimization', "-O should alias --optimization.");

            test.done();
        },
        "rootpath": function (test) {
            test.ok(knownOpts.hasOwnProperty('rootpath'), "--rootpath option should be provided.");
            test.strictEqual(knownOpts.rootpath, String, "--rootpath should be a String.");

            test.ok(shortHands.hasOwnProperty('rp'), "-rp alias should be provided.");
            test.strictEqual(shortHands.rp[0], '--rootpath', "-rp should alias --rootpath.");

            test.done();
        },
        "relativeUrls": function (test) {
            test.ok(knownOpts.hasOwnProperty('relativeUrls'), "--relativeUrls option should be provided.");
            test.strictEqual(knownOpts.relativeUrls, Boolean, "--relativeUrls should be Boolean.");

            test.ok(shortHands.hasOwnProperty('ru'), "-ru alias should be provided.");
            test.strictEqual(shortHands.ru[0], '--relativeUrls', "-ru should alias --relativeUrls.");

            // dash-case to camelCase
            test.ok(shortHands.hasOwnProperty('relative-urls'), "--relative-urls alias should be provided.");
            test.strictEqual(shortHands['relative-urls'][0], '--relativeUrls', "--relative-urls should alias --relativeUrls.");

            test.done();
        },
        "color": function (test) {
            test.ok(knownOpts.hasOwnProperty('color'), "--color option should be provided.");
            test.strictEqual(knownOpts.color, Boolean, "--color should be Boolean.");

            // no shorthand for --color

            test.done();
        },
        "compress": function (test) {
            test.ok(knownOpts.hasOwnProperty('compress'), "--compress option should be provided.");
            test.strictEqual(knownOpts.compress, Boolean, "--compress should be Boolean.");

            test.ok(shortHands.hasOwnProperty('x'), "-x alias should be provided.");
            test.strictEqual(shortHands.x[0], '--compress', "-x should alias --compress.");

            test.done();
        },
        "yuicompress": function (test) {
            test.ok(knownOpts.hasOwnProperty('yuicompress'), "--yuicompress option should be provided.");
            test.strictEqual(knownOpts.yuicompress, Boolean, "--yuicompress should be Boolean.");

            // no shorthand yuicompress

            // dash-case to camelCase
            test.ok(shortHands.hasOwnProperty('yui-compress'), "--yui-compress alias should be provided.");
            test.strictEqual(shortHands['yui-compress'][0], '--yuicompress', "--yui-compress should alias --yuicompress.");

            test.done();
        },
        "dumpLineNumbers": function (test) {
            test.ok(knownOpts.hasOwnProperty('dumpLineNumbers'), "--dumpLineNumbers option should be provided.");
            test.deepEqual(knownOpts.dumpLineNumbers, ['comments', 'mediaquery', 'all'], "--dumpLineNumbers should be ['comments', 'mediaquery', 'all'].");

            // no shorthand dumpLineNumbers

            // dash-case to camelCase
            test.ok(shortHands.hasOwnProperty('line-numbers'), "--line-numbers alias should be provided.");
            test.strictEqual(shortHands['line-numbers'][0], '--dumpLineNumbers', "--line-numbers should alias --dumpLineNumbers.");

            test.done();
        },
        "lint": function (test) {
            test.ok(knownOpts.hasOwnProperty('lint'), "--lint option should be provided.");
            test.strictEqual(knownOpts.lint, Boolean, "--lint should be Boolean.");

            test.ok(shortHands.hasOwnProperty('l'), "-l alias should be provided.");
            test.strictEqual(shortHands.l[0], '--lint', "-l should alias --lint.");

            test.done();
        },
        "strictImports": function (test) {
            test.ok(knownOpts.hasOwnProperty('strictImports'), "--strictImports option should be provided.");
            test.strictEqual(knownOpts.strictImports, Boolean, "--strictImports should be Boolean.");

            // no shorthand --strictImports

            // dash-case to camelCase
            test.ok(shortHands.hasOwnProperty('strict-imports'), "--strict-imports alias should be provided.");
            test.strictEqual(shortHands['strict-imports'][0], '--strictImports', "--strict-imports should alias --strictImports.");

            test.done();
        },
        "strictMaths": function (test) {
            test.ok(knownOpts.hasOwnProperty('strictMaths'), "--strictMaths option should be provided.");
            test.strictEqual(knownOpts.strictMaths, Boolean, "--strictMaths should be Boolean.");

            test.ok(shortHands.hasOwnProperty('sm'), "-sm alias should be provided.");
            test.strictEqual(shortHands.sm[0], '--strictMaths', "-sm should alias --strictMaths.");

            // dash-case to camelCase
            test.ok(shortHands.hasOwnProperty('strict-maths'), "--strict-maths alias should be provided.");
            test.strictEqual(shortHands['strict-maths'][0], '--strictMaths', "--strict-maths should alias --strictMaths.");

            test.done();
        },
        "strictUnits": function (test) {
            test.ok(knownOpts.hasOwnProperty('strictUnits'), "--strictUnits option should be provided.");
            test.strictEqual(knownOpts.strictUnits, Boolean, "--strictUnits should be Boolean.");

            test.ok(shortHands.hasOwnProperty('su'), "-su alias should be provided.");
            test.strictEqual(shortHands.su[0], '--strictUnits', "-su should alias --strictUnits.");

            // dash-case to camelCase
            test.ok(shortHands.hasOwnProperty('strict-units'), "--strict-units alias should be provided.");
            test.strictEqual(shortHands['strict-units'][0], '--strictUnits', "--strict-units should alias --strictUnits.");

            test.done();
        },
        "silent": function (test) {
            test.ok(knownOpts.hasOwnProperty('silent'), "--silent option should be provided.");
            test.strictEqual(knownOpts.silent, Boolean, "--silent should be Boolean.");

            test.ok(shortHands.hasOwnProperty('s'), "-s alias should be provided.");
            test.strictEqual(shortHands.s[0], '--silent', "-s should alias --silent.");

            test.done();
        },
        "verbose": function (test) {
            test.ok(knownOpts.hasOwnProperty('verbose'), "--verbose option should be provided.");
            test.strictEqual(knownOpts.verbose, Boolean, "--verbose should be Boolean.");

            test.ok(shortHands.hasOwnProperty('V'), "-V alias should be provided.");
            test.strictEqual(shortHands.V[0], '--verbose', "-V should alias --verbose.");

            test.done();
        },
        "legacy": function (test) {
            // not present in knownOpts

            test.ok(shortHands.hasOwnProperty('legacy'), "--legacy alias should be provided.");
            test.deepEqual(shortHands.legacy, ['--no-strictMaths', '--no-strictUnits'], "--legacy should be ['--no-strictMaths', '--no-strictUnits'].");

            test.done();
        }
    },

    "cli options": {
        "help": function (test) {
            test.ok(knownOpts.hasOwnProperty('help'), "--help option should be provided.");
            test.strictEqual(knownOpts.help, Boolean, "--help should be Boolean.");

            test.ok(shortHands.hasOwnProperty('h'), "-h alias should be provided.");
            test.strictEqual(shortHands.h[0], '--help', "-h should alias --help.");

            test.done();
        },
        "version": function (test) {
            test.ok(knownOpts.hasOwnProperty('version'), "--version option should be provided.");
            test.strictEqual(knownOpts.version, Boolean, "--version should be Boolean.");

            test.ok(shortHands.hasOwnProperty('v'), "-v alias should be provided.");
            test.strictEqual(shortHands.v[0], '--version', "-v should alias --version.");

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
