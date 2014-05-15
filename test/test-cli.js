/*global describe, it, before, beforeEach, after, afterEach, chai, should, sinon */
/**
Tests for the cli arguments
**/
var path = require('path');

var cli = require('../lib/cli');
var knownOpts = cli.knownOpts;
var shortHands = cli.shortHands;
var mix = require('../lib/utils').mix;

// Parsing Helpers
var rootDir = 'fixtures/cli/';
var absRoot = __dirname + '/' + rootDir;

describe('CLI', function () {
    /*jshint expr:true */

    describe("Constants", function () {
        describe("MAX_WORKERS", function () {
            it("should be 8", function () {
                should.exist(cli.MAX_WORKERS);
                cli.MAX_WORKERS.should.equal(8);
            });
        });
        describe("PATH_DELIM", function () {
            it("should be platform-appropriate", function () {
                should.exist(cli.PATH_DELIM);
                cli.PATH_DELIM.should.equal(path.delimiter);
            });
        });
    });

    describe("Master Config", function () {
        it("should match defaults", function () {
            should.exist(cli.masterDefaults);
            cli.masterDefaults.should.eql({
                directory: process.cwd(),
                match: "**/*.less",
                workers: Math.min(require('os').cpus().length, cli.MAX_WORKERS)
            });
        });
        describe("option", function () {
            describe("--directory", function () {
                it("should be a path", function () {
                    knownOpts.should.have.property('directory')
                        .that.equals(path);
                });
                it("should be aliased -d", function () {
                    shortHands.should.have.property('d')
                        .that.deep.equals(['--directory']);
                });
            });
            describe("--outputdir", function () {
                it("should be a path", function () {
                    knownOpts.should.have.property('outputdir')
                        .that.equals(path);
                });
                it("should be aliased -o", function () {
                    shortHands.should.have.property('o')
                        .that.deep.equals(['--outputdir']);
                });
            });
            describe("--match", function () {
                it("should be a String", function () {
                    knownOpts.should.have.property('match')
                        .that.equals(String);
                });
                it("should be aliased -m", function () {
                    shortHands.should.have.property('m')
                        .that.deep.equals(['--match']);
                });
            });
            describe("--workers", function () {
                it("should be a Number", function () {
                    knownOpts.should.have.property('workers')
                        .that.equals(Number);
                });
                it("should be aliased -w", function () {
                    shortHands.should.have.property('w')
                        .that.deep.equals(['--workers']);
                });
            });
        });
    });

    describe("Worker Config", function () {
        it("should match defaults", function () {
            should.exist(cli.workerDefaults);
            cli.workerDefaults.should.eql({
                paths           : [],
                optimization    : 1,
                maxLineLen      : -1,
                rootpath        : '',
                relativeUrls    : false,
                color           : true,
                compress        : false,
                yuicompress     : false,
                dumpLineNumbers : false,
                lint            : false,
                strictImports   : false,
                strictMath      : false,
                strictUnits     : false,
                ieCompat        : true,
                silent          : false,
                verbose         : false,
                urlArgs         : ''
            });
        });
        describe("option", function () {
            describe("--paths", function () {
                it("should be an array of paths", function () {
                    knownOpts.should.have.property('paths')
                        .that.deep.equals([path, Array]);
                });
                it("should be aliased -I", function () {
                    shortHands.should.have.property('I')
                        .that.deep.equals(['--paths']);
                });
                it("should be dash-cased --include-path", function () {
                    shortHands.should.have.property('include-path')
                        .that.deep.equals(['--paths']);
                });
            });
            describe("--optimization", function () {
                it("should be 0, 1, or 2", function () {
                    knownOpts.should.have.property('optimization')
                        .that.deep.equals([0,1,2]);
                });
                it("should be aliased -O", function () {
                    shortHands.should.have.property('O')
                        .that.deep.equals(['--optimization']);
                });
            });
            describe("--maxLineLen", function () {
                it("should be a Number", function () {
                    knownOpts.should.have.property('maxLineLen')
                        .that.equals(Number);
                });
                it("should be dash-cased --max-line-len", function () {
                    shortHands.should.have.property('max-line-len')
                        .that.deep.equals(['--maxLineLen']);
                });
            });
            describe("--rootpath", function () {
                it("should be a String", function () {
                    knownOpts.should.have.property('rootpath')
                        .that.equals(String);
                });
                it("should be aliased -rp", function () {
                    shortHands.should.have.property('rp')
                        .that.deep.equals(['--rootpath']);
                });
            });
            describe("--relativeUrls", function () {
                it("should be a Boolean", function () {
                    knownOpts.should.have.property('relativeUrls')
                        .that.equals(Boolean);
                });
                it("should be aliased -ru", function () {
                    shortHands.should.have.property('ru')
                        .that.deep.equals(['--relativeUrls']);
                });
                it("should be dash-cased --relative-urls", function () {
                    shortHands.should.have.property('relative-urls')
                        .that.deep.equals(['--relativeUrls']);
                });
            });
            describe("--color", function () {
                it("should be a Boolean", function () {
                    knownOpts.should.have.property('color')
                        .that.equals(Boolean);
                });
                // no shorthand for --color
            });
            describe("--compress", function () {
                it("should be a Boolean", function () {
                    knownOpts.should.have.property('compress')
                        .that.equals(Boolean);
                });
                it("should be aliased -x", function () {
                    shortHands.should.have.property('x')
                        .that.deep.equals(['--compress']);
                });
            });
            describe("--yuicompress", function () {
                it("should be a Boolean", function () {
                    knownOpts.should.have.property('yuicompress')
                        .that.equals(Boolean);
                });
                // no shorthand yuicompress
                it("should be dash-cased -yui-compress", function () {
                    shortHands.should.have.property('yui-compress')
                        .that.deep.equals(['--yuicompress']);
                });
            });
            describe("--dumpLineNumbers", function () {
                it("should be 'comments', 'mediaquery', or 'all'", function () {
                    knownOpts.should.have.property('dumpLineNumbers')
                        .that.deep.equals(['comments', 'mediaquery', 'all']);
                });
                // no shorthand dumpLineNumbers
                it("should be dash-cased -line-numbers", function () {
                    shortHands.should.have.property('line-numbers')
                        .that.deep.equals(['--dumpLineNumbers']);
                });
            });
            describe("--lint", function () {
                it("should be a Boolean", function () {
                    knownOpts.should.have.property('lint')
                        .that.equals(Boolean);
                });
                it("should be aliased -l", function () {
                    shortHands.should.have.property('l')
                        .that.deep.equals(['--lint']);
                });
            });
            describe("--strictImports", function () {
                it("should be a Boolean", function () {
                    knownOpts.should.have.property('strictImports')
                        .that.equals(Boolean);
                });
                // no shorthand --strictImports
                it("should be dash-cased --strict-imports", function () {
                    shortHands.should.have.property('strict-imports')
                        .that.deep.equals(['--strictImports']);
                });
            });
            describe("--strictMath", function () {
                it("should be a Boolean", function () {
                    knownOpts.should.have.property('strictMath')
                        .that.equals(Boolean);
                });
                it("should be aliased -sm", function () {
                    shortHands.should.have.property('sm')
                        .that.deep.equals(['--strictMath']);
                });
                it("should be dash-cased --strict-math", function () {
                    shortHands.should.have.property('strict-math')
                        .that.deep.equals(['--strictMath']);
                });
            });
            describe("--strictUnits", function () {
                it("should be a Boolean", function () {
                    knownOpts.should.have.property('strictUnits')
                        .that.equals(Boolean);
                });
                it("should be aliased -su", function () {
                    shortHands.should.have.property('su')
                        .that.deep.equals(['--strictUnits']);
                });
                it("should be dash-cased --strict-units", function () {
                    shortHands.should.have.property('strict-units')
                        .that.deep.equals(['--strictUnits']);
                });
            });
            describe("--silent", function () {
                it("should be a Boolean", function () {
                    knownOpts.should.have.property('silent')
                        .that.equals(Boolean);
                });
                it("should be aliased -s", function () {
                    shortHands.should.have.property('s')
                        .that.deep.equals(['--silent']);
                });
            });
            describe("--verbose", function () {
                it("should be a Boolean", function () {
                    knownOpts.should.have.property('verbose')
                        .that.equals(Boolean);
                });
                it("should be aliased -V", function () {
                    shortHands.should.have.property('V')
                        .that.deep.equals(['--verbose']);
                });
            });
            describe("--ieCompat", function () {
                it("should be a Boolean", function () {
                    knownOpts.should.have.property('ieCompat')
                        .that.equals(Boolean);
                });
                // no shorthand --ieCompat
                it("should be dash-cased --ie-compat", function () {
                    shortHands.should.have.property('ie-compat')
                        .that.deep.equals(['--ieCompat']);
                });
                // nopt doesn't invert aliases automagically
                it("should invert dash-cased variant", function () {
                    shortHands.should.have.property('no-ie-compat')
                        .that.deep.equals(['--no-ieCompat']);
                });
            });
            describe("--legacy", function () {
                // not present in knownOpts
                it("should alias --no-strictMath and --no-strictUnits", function () {
                    shortHands.should.have.property('legacy')
                        .that.deep.equals(['--no-strictMath', '--no-strictUnits']);
                });
            });
            describe("--urlArgs", function () {
                it("should be a String", function () {
                    knownOpts.should.have.property('urlArgs')
                        .that.equals(String);
                });
                // no shorthand --urlArgs
                it("should be dash-cased --url-args", function () {
                    shortHands.should.have.property('url-args')
                        .that.deep.equals(['--urlArgs']);
                });
            });
            describe("--sourceMap", function () {
                it("should be String or null", function () {
                    knownOpts.should.have.property('sourceMap')
                        .that.deep.equals([String, null]);
                });
                // no shorthand sourceMap
                it("should be dash-cased --source-map", function () {
                    shortHands.should.have.property('source-map')
                        .that.deep.equals(['--sourceMap']);
                });
            });
        });
    });

    describe("Misc option", function () {
        describe("--help", function () {
            it("should be a Boolean", function () {
                knownOpts.should.have.property('help')
                    .that.equals(Boolean);
            });
            it("should be aliased -h", function () {
                shortHands.should.have.property('h')
                    .that.deep.equals(['--help']);
            });
        });
        describe("--quiet", function () {
            it("should be a Boolean", function () {
                knownOpts.should.have.property('quiet')
                    .that.equals(Boolean);
            });
            it("should be aliased -q", function () {
                shortHands.should.have.property('q')
                    .that.deep.equals(['--quiet']);
            });
        });
        describe("--version", function () {
            it("should be a Boolean", function () {
                knownOpts.should.have.property('version')
                    .that.equals(Boolean);
            });
            it("should be aliased -v", function () {
                shortHands.should.have.property('v')
                    .that.deep.equals(['--version']);
            });
        });
    });

    describe("Method", function () {
        describe("usage()", function () {
            it("should have content", function () {
                cli._getUsage().should.have.length.above(0);
            });
            describe("when executed", function () {
                it("calls _getUsage()", function () {
                    var called = 0;
                    cli._getUsage = function () {
                        called += 1;
                        return "";
                    };
                    cli.usage();
                    called.should.equal(1);
                });
            });
        });
        describe("version()", function () {
            it("should be obtained from package.json", function () {
                var pack = require('../package.json');
                cli._getVersion().should.equal(pack.version);
            });
            describe("when executed", function () {
                it("calls _getVersion()", function () {
                    var called = 0;
                    cli._getVersion = function () {
                        called += 1;
                        return "";
                    };
                    cli.version();
                    called.should.equal(1);
                });
            });
        });
        describe("clean()", function () {
            describe("called with empty object", function () {
                it("should return empty config", function () {
                    cli.clean(mix()).should.deep.equal({});
                });
            });
            describe("called with second parameter 'true'", function () {
                it("should not pass options through nopt.clean()", function () {
                    cli.clean({
                        optimization: "foo"
                    }, true).should.deep.equal({
                        optimization: "foo"
                    });
                });
            });
            describe("called with unclean object", function () {
                it("should return cleaned config", function () {
                    // nopt rejects invalid values
                    cli.clean({
                        optimization: "foo"
                    }).should.deep.equal({});
                });
            });
        });
        describe("parse()", function () {
            describe("called with full argv", function () {
                it("should use nopt default slice", function () {
                    var parsed = cli.parse(['node', 'less-cluster', 'foo']);
                    parsed.argv.remain.should.deep.equal(['foo']);
                });
            });
            describe("called with custom slice arg", function () {
                it("should overwrite nopt slice", function () {
                    var parsed = cli.parse(['foo'], 0);
                    parsed.argv.remain.should.deep.equal(['foo']);
                });
            });
        });
    });

    describe("Parsing", function () {
        describe("--directory", function () {
            var topic = cli.parse(['-d', rootDir], 0);
            it("should resolve to CWD", function () {
                topic.directory.should.equal(path.resolve(rootDir));
            });
            describe("as first remaining argument", function () {
                var topic = cli.parse([rootDir], 0);
                it("should work implicitly", function () {
                    topic.directory.should.equal(path.resolve(rootDir));
                });
                describe("with --outputdir", function () {
                    var topic = cli.parse(['-o', rootDir + 'out', rootDir], 0);
                    it("should still work", function () {
                        topic.directory.should.equal(path.resolve(rootDir));
                    });
                });
            });
        });
        describe("--outputdir", function () {
            var topic = cli.parse(['-o', rootDir], 0);
            it("should resolve to CWD", function () {
                topic.outputdir.should.equal(path.resolve(rootDir));
            });
            describe("as first remaining argument", function () {
                describe("with --directory", function () {
                    var topic = cli.parse(['-d', rootDir, rootDir + 'out'], 0);
                    it("should still work", function () {
                        topic.outputdir.should.equal(path.resolve(rootDir + 'out'));
                    });
                });
            });
            describe("as second remaining argument", function () {
                var topic = cli.parse([rootDir, rootDir + 'out'], 0);
                it("should work implicitly", function () {
                    topic.outputdir.should.equal(path.resolve(rootDir + 'out'));
                });
            });
        });
        parseAdditionalFiles("additional (absolute) files passed with", [
            absRoot + '../file-reader/' + 'a.less',
            absRoot + '../file-reader/' + 'b.less'
        ]),
        parseAdditionalFiles("additional (relative) files passed with", [
            'a.less',
            'b.less'
        ]),
        describe("--include-path", function () {
            describe("with single delimited string", function () {
                // each included path is fully-resolved
                var args = [
                    '--include-path',
                    path.resolve(rootDir) + cli.PATH_DELIM + rootDir
                ];
                var topic = cli.parse(args, 0);
                it("should split on PATH_DELIM", function () {
                    topic.paths.should.have.length(2);
                });
                it("should resolve all paths", function () {
                    topic.paths.should.deep.equal([
                        path.resolve(rootDir),
                        path.resolve(rootDir)
                    ]);
                });
            });
            describe("with multiple option strings", function () {
                var args = [
                    '--include-path', 'fixtures/cli',
                    '--include-path', 'fixtures/imports',
                    'fixtures/file-reader/d.less'
                ];
                var topic = cli.parse(args, 0);
                it("should collect all args", function () {
                    topic.paths.should.have.length(2);
                });
                it("should resolve correctly", function () {
                    topic.paths.should.deep.equal([
                        path.resolve('fixtures/cli'),
                        path.resolve('fixtures/imports')
                    ]);
                });
            });
        });
        describe("--silent", function () {
            var topic = cli.parse(['--silent'], 0);
            it("should enable --quiet", function () {
                topic.quiet.should.be.true;
            });
        });
        describe("--quiet --verbose", function () {
            var topic = cli.parse(['--quiet', '--verbose'], 0);
            it("should keep --verbose disabled", function () {
                topic.verbose.should.be.false;
            });
        });
    });

    describe("SourceMap Chicanery", function () {
        // the most convoluted CLI options ever
        describe("--source-map", function () {
            it("handles an absurd amount of magic");
        });
    });

});

function parseAdditionalFiles(title, files) {
    // automagical nested describe()
    var subDescribe = function (subtitle, args) {
        describe(subtitle, function () {
            var topic = cli.parse(args.concat(files), 0);
            it("should populate files array", function () {
                topic.files.should.be.an('array');
            });
            it("with two members", function () {
                topic.files.should.have.length(files.length);
            });
            it("resolved to directory", function () {
                files.forEach(function (file, i) {
                    topic.files[i].should.equal(path.resolve(topic.directory, file));
                });
            });
        });
    };

    describe(title, function () {
        subDescribe(
            "explicit (absolute) --directory and --outputdir",
            ['-d', absRoot, '-o', absRoot + 'out']
        );
        subDescribe(
            "implicit (absolute) directory and outputdir",
            [absRoot, absRoot + 'out']
        );
        subDescribe(
            "explicit (relative) --directory and --outputdir",
            ['-d', rootDir, '-o', rootDir + 'out']
        );
        subDescribe(
            "implicit (relative) directory and outputdir",
            [rootDir, rootDir + 'out']
        );
    });
}
