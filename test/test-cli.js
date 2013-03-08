/**
Tests for the cli arguments
**/
var assert = require('assert');
var vows = require('vows');
var path = require('path');

var cli = require('../lib/cli');
var knownOpts = cli.knownOpts;
var shortHands = cli.shortHands;

var suite = vows.describe('CLI');

// Constants
suite.addBatch({
    "exported property": {
        "MAX_WORKERS": {
            topic: cli.MAX_WORKERS,
            "should be 8": function (topic) {
                assert.equal(topic, 8);
            }
        },
        "PATH_DELIM": {
            topic: cli.PATH_DELIM,
            "should be platform-appropriate": function (topic) {
                assert.strictEqual(topic, (process.platform === 'win32' ? ';' : ':'));
            }
        }
    }
});

// Config Helpers
function assertIncludes(key) {
    return function (topic) {
        assert.include(topic, key);
    };
}

function keyValueEquals(key, val) {
    var comparator = assert.strictEqual;

    // non-primitive values need deepEqual
    if ('object' === typeof val) {
        comparator = assert.deepEqual;
    }

    return function (topic) {
        comparator(topic[key], val);
    };
}

function defaultsMatch(expected) {
    var context = {
        topic: function () {
            // "master default" => "masterDefaults"
            var propertyName = this.context.name.split(' ').shift() + 'Defaults';
            return cli[propertyName];
        },
        "keys": {},
        "values": {}
    };

    var expectedKeys = Object.keys(expected);

    expectedKeys.forEach(function (key) {
        context.keys["include '" + key + "'"] = assertIncludes(key);
        context.values["default '" + key + "' correctly"] = keyValueEquals(key, expected[key]);
    });

    context.keys["include only expected"] = function (topic) {
        assert.strictEqual(Object.keys(topic).length, expectedKeys.length);
    };

    return context;
}

// Master Config
suite.addBatch({
    "master default": defaultsMatch({
        directory: process.cwd(),
        match: "**/*.less",
        workers: Math.min(require('os').cpus().length, cli.MAX_WORKERS)
    }),
    "master options": {
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

// Worker Config
suite.addBatch({
    "worker default": defaultsMatch({
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
    }),
    "worker options": {
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

// CLI Options
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

// Methods
suite.addBatch({
    "usage()": {
        topic: cli._getUsage(),
        "should have content": function (topic) {
            assert.ok(topic);
        },
        "calls _getUsage()": {
            topic: function () {
                var called = 0;
                cli._getUsage = function () {
                    called += 1;
                    return "";
                };
                cli.usage();
                return called;
            },
            "when executed": function (topic) {
                assert.strictEqual(topic, 1);
            }
        }
    },
    "version()": {
        topic: cli._getVersion(),
        "should be obtained from package.json": function (topic) {
            var pack = require('../package.json');
            assert.equal(topic, pack.version);
        },
        "calls _getVersion()": {
            topic: function () {
                var called = 0;
                cli._getVersion = function () {
                    called += 1;
                    return "";
                };
                cli.version();
                return called;
            },
            "when executed": function (topic) {
                assert.strictEqual(topic, 1);
            }
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

// Parsing Helpers
var rootDir = 'fixtures/cli/';
var absRoot = __dirname + '/' + rootDir;

function additionalFiles(files) {
    // http://vowsjs.org/#-macros
    var subContext = function (args) {
        return {
            topic: function () {
                return cli.parse(args.concat(files), 0);
            },
            "should populate files array": function (topic) {
                assert.isArray(topic._files);
            },
            "with two members": function (topic) {
                assert.equal(topic._files.length, files.length);
            },
            "resolved to directory": function (topic) {
                files.forEach(function (file, i) {
                    assert.equal(topic._files[i], path.resolve(topic.directory, file));
                });
            }
        };
    };

    var context = {
        "explicit (absolute) --directory and --outputdir": subContext(
            ['-d', absRoot, '-o', absRoot + 'out']
        ),
        "implicit (absolute) directory and outputdir": subContext(
            [absRoot, absRoot + 'out']
        ),
        "explicit (relative) --directory and --outputdir": subContext(
            ['-d', rootDir, '-o', rootDir + 'out']
        ),
        "implicit (relative) directory and outputdir": subContext(
            [rootDir, rootDir + 'out']
        )
    };

    return context;
}

// Parsing
suite.addBatch({
    "parsing": {
        "--directory": {
            topic: cli.parse(['-d', rootDir], 0),
            "should resolve to CWD": function (topic) {
                assert.strictEqual(topic.directory, path.resolve(rootDir));
            },
            "as first remaining argument": {
                topic: cli.parse([rootDir], 0),
                "should work implicitly": function (topic) {
                    assert.strictEqual(topic.directory, path.resolve(rootDir));
                },
                "with --outputdir": {
                    topic: cli.parse(['-o', rootDir + 'out', rootDir], 0),
                    "should still work": function (topic) {
                        assert.strictEqual(topic.directory, path.resolve(rootDir));
                    }
                }
            }
        },
        "--outputdir": {
            topic: cli.parse(['-o', rootDir], 0),
            "should resolve to CWD": function (topic) {
                assert.strictEqual(topic.outputdir, path.resolve(rootDir));
            },
            "as first remaining argument": {
                "with --directory": {
                    topic: cli.parse(['-d', rootDir, rootDir + 'out'], 0),
                    "should still work": function (topic) {
                        assert.strictEqual(topic.outputdir, path.resolve(rootDir + 'out'));
                    }
                }
            },
            "as second remaining argument": {
                topic: cli.parse([rootDir, rootDir + 'out'], 0),
                "should work implicitly": function (topic) {
                    assert.strictEqual(topic.outputdir, path.resolve(rootDir + 'out'));
                }
            }
        },
        "additional (absolute) files passed with": additionalFiles([
            absRoot + '../file-reader/' + 'a.less',
            absRoot + '../file-reader/' + 'b.less'
        ]),
        "additional (relative) files passed with": additionalFiles([
            'a.less',
            'b.less'
        ]),
        "paths (single delimited string)": function () {
            assert.strictEqual(cli.PATH_DELIM, (process.platform === 'win32' ? ';' : ':'));

            // each included path is fully-resolved
            var includedPaths = [rootDir, rootDir].map(path.resolve);
            var opts = cli.parse(['node', 'less-cluster', '-I', includedPaths.join(cli.PATH_DELIM)]);

            assert.deepEqual(opts.paths, includedPaths);
        },
        "--silent": {
            topic: function () {
                return cli.parse(['--silent'], 0);
            },
            "should enable --quiet": function (topic) {
                assert.strictEqual(topic.quiet, true);
            }
        },
        "--quiet --verbose": {
            topic: function () {
                return cli.parse(['--quiet', '--verbose'], 0);
            },
            "should keep --verbose disabled": function (topic) {
                assert.strictEqual(topic.verbose, false);
            }
        }
    }
});

suite["export"](module);
