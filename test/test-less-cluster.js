/*global describe, it, before, beforeEach, after, afterEach, chai, should, sinon */
/**
Tests for the main class
**/
var path = require('path');

var EventEmitter = require('events').EventEmitter;
var LessCluster = require('../');

var importsDir = __dirname + '/fixtures/imports/';
var includeDir = __dirname + '/fixtures/imports/included/';

describe("LessCluster", function () {
    /*jshint expr:true */

    describe("static defaults", function () {
        it("should be present", function () {
            should.exist(LessCluster.defaults);
        });
        it("should be an object", function () {
            LessCluster.defaults.should.be.an('object');
        });
        it("should have 'directory' default", function () {
            LessCluster.defaults.should.have.property('directory');
        });
        it("should have 'match' default", function () {
            LessCluster.defaults.should.have.property('match');
        });
        it("should have 'workers' default", function () {
            LessCluster.defaults.should.have.property('workers');
        });
    });

    describe("checkArguments()", function () {
        it("should be a static method", function () {
            LessCluster.should.itself.respondTo('checkArguments');
        });
        it("should allow missing config parameter", function () {
            should.not.Throw(function () {
                var options = LessCluster.checkArguments();
                should.exist(options);
                options.should.be.an('object');
            });
        });
        it("should default options.directory to CWD", function () {
            var options = LessCluster.checkArguments({});

            options.directory.should.equal(LessCluster.defaults.directory);
        });
        it("should default options.outputdir to options.directory", function () {
            var options = LessCluster.checkArguments({});

            options.outputdir.should.equal(options.directory);
        });
        it("should not override custom outputdir", function () {
            var options = LessCluster.checkArguments({
                outputdir: 'foo'
            });

            options.outputdir.should.equal('foo');
            options.outputdir.should.not.equal(options.directory);
        });
    });

    describe("factory", function () {
        it("should instantiate without 'new'", function () {
            /*jshint newcap: false */
            var instance = LessCluster();
            instance.should.be.an.instanceof(LessCluster);
        });
    });

    describe("instance", function () {
        var instance;
        before(function () {
            instance = new LessCluster();
        });

        it("should instantiate safely with no config", function () {
            should.exist(instance);
        });
        it("should inherit EventEmitter", function () {
            instance.should.be.an.instanceof(EventEmitter);
        });
        it("should set options", function () {
            instance.should.have.ownProperty('options');
        });
        it("should default all option values", function () {
            instance.options.should.have.property('directory',  LessCluster.defaults.directory);
            instance.options.should.have.property('match',      LessCluster.defaults.match);
            instance.options.should.have.property('workers',    LessCluster.defaults.workers);
        });
        it("should setup private caches", function () {
            instance.should.have.ownProperty('_parents',  {});
            instance.should.have.ownProperty('_children', {});
            instance.should.have.ownProperty('_fileData', {});
        });
    });

    describe("getNextFile()", function () {
        beforeEach(function () {
            this.instance = new LessCluster();
        });
        afterEach(function () {
            this.instance = null;
        });

        it("should return first file in the list, if available", function () {
            this.instance.filesToProcess = ["foo.less", "bar.less"];
            var result = this.instance.getNextFile();
            result.should.equal("foo.less");
        });

        it("should return undefined if no files to process remain", function () {
            this.instance.filesToProcess = ["foo.less"];
            this.instance.getNextFile(); // remove first entry
            var result = this.instance.getNextFile();
            should.not.exist(result);
        });

        it("should return undefined if no files to process exist", function () {
            var result = this.instance.getNextFile();
            should.not.exist(result);
        });
    });

    describe("collect()", function () {
        var instance;
        before(function () {
            instance = new LessCluster({
                "directory": importsDir
            });
        });

        it("_getDestinationPath()", function () {
            var actually = instance._getDestinationPath(addImportsDir('base.less'));
            var expected = addImportsDir('base.css');
            actually.should.equal(expected);
        });

        it("_getRelativePath()", function () {
            var actually = instance._getRelativePath(__dirname + '/fixtures');
            var expected = 'test/fixtures';
            actually.should.equal(expected);
        });
        it("_getGlobPattern()", function () {
            var actually = instance._getGlobPattern('foo');
            var expected = 'foo/' + instance.options.match;
            actually.should.equal(expected);
        });
        it("_getLessExtension()", function () {
            instance._getLessExtension('foo/bar.less').should.equal('foo/bar.less');
            instance._getLessExtension('baz/qux').should.equal('baz/qux.less');
        });
        it("_isNotCSS()", function () {
            instance._isNotCSS('foo/bar.less').should.be.true;
            instance._isNotCSS('baz/qux.css').should.be.false;
        });
        it("_parseImports()");
        it("_finishCollect()");

        describe("when executed", function () {
            var cb = {};
            before(function (done) {
                instance.collect(function (err, data) {
                    cb.err = err;
                    cb.data = data;
                    done();
                });
            });

            it("does not error", function () {
                should.not.exist(cb.err);
            });
            it("provides data object", function () {
                should.exist(cb.data);
                cb.data.should.be.an('object');
            });
            it("finds all files successfully", function () {
                cb.data.should.have.keys([
                    addImportsDir("_variables.less"),
                    addImportsDir("base.less"),
                    addImportsDir("included/a.less"),
                    addImportsDir("modules/child.less"),
                    addImportsDir("modules/parent.less"),
                    addImportsDir("modules/solo.less"),
                    addImportsDir("themes/fancy.less"),
                    addImportsDir("themes/simple.less")
                ]);
            });
        });
    });

    describe("unfiltered", function () {
        filtersOutput("default output", {
            "toProcess": [
                "_variables.less",
                "base.less",
                "included/a.less",
                "modules/child.less",
                "modules/parent.less",
                "modules/solo.less",
                "themes/fancy.less",
                "themes/simple.less"
            ]
        });
    });

    describe("filtering", function () {
        filtersOutput("[base.less]", {
            "toFilter" : ["base.less"],
            "toProcess": ["base.less"],
            "toRead"   : [
                "_variables.less",
                "base.less",
                "included/a.less",
                "modules/child.less",
                "modules/parent.less",
                "themes/fancy.less",
                "themes/simple.less"
            ]
        });
        filtersOutput("[modules/parent.less]", {
            "toFilter" : ["modules/parent.less"],
            "toProcess": ["modules/parent.less"],
            "toRead"   : [
                "_variables.less",
                "base.less",
                "included/a.less",
                "modules/child.less",
                "modules/parent.less",
                "themes/fancy.less",
                "themes/simple.less"
            ]
        });
        filtersOutput("[_variables.less]", {
            "toFilter" : ["_variables.less"],
            "toProcess": [
                "_variables.less"
                // "modules/child.less",
                // "modules/parent.less",
                // "themes/fancy.less"
            ],
            "toRead"   : [
                "_variables.less",
                // TODO: grandparents
                // "base.less",
                // "included/a.less",
                "modules/child.less",
                "modules/parent.less",
                "themes/fancy.less",
                "themes/simple.less"
            ]
        });
        filtersOutput("[themes/simple.less]", {
            "toFilter" : ["themes/simple.less"],
            "toProcess": ["themes/simple.less"],
            "toRead"   : [
                "_variables.less",
                "modules/child.less",
                "themes/simple.less"
            ]
        });
        filtersOutput("[modules/solo.less]", {
            "toFilter" : ["modules/solo.less"],
            "toProcess": ["modules/solo.less"],
            "toRead"   : ["modules/solo.less"]
        });
    });
});

function addImportsDir(relativePath) {
    if (Array.isArray(relativePath)) {
        return relativePath.map(addImportsDir);
    }
    return path.join(importsDir, relativePath);
}

function removeImportsDir(relativePath) {
    if (Array.isArray(relativePath)) {
        return relativePath.map(removeImportsDir);
    }
    return relativePath.replace(importsDir, '');
}

function expectFiles(subtitle, results, expected) {
    // creates a new context within the currently executing suite
    describe(subtitle, function () {
        /*jshint laxbreak:true */
        var testLengthName = expected.length
            ? "has " + expected.length + " item"
            : "has no items";
        if (expected.length > 1) {
            testLengthName += "s";
        }

        it(testLengthName, function () {
            var actually = results[subtitle];
            // console.error(JSON.stringify(actually, null, 4));
            actually.should.have.length(expected.length);
        });

        it("matches all files", function () {
            var actually = results[subtitle];
            var absolutized = expected.map(addImportsDir);
            actually.should.eql(absolutized);
        });

        expected.forEach(function (relativePath, i) {
            it(relativePath, function () {
                var actually = results[subtitle];
                should.exist(actually[i]);
                actually[i].should.equal(addImportsDir(relativePath));
            });
        });
    });
}

function filtersOutput(title, config) {
    // create top-level context
    describe(title, function () {
        var instance;
        var results = {};

        before(function (done) {
            var relativePaths = config.toFilter;
            var instanceConfig = {
                "paths": [includeDir],
                "directory": importsDir
            };

            if (relativePaths && relativePaths.length) {
                instanceConfig._files = relativePaths.map(function (p) {
                    return path.join(importsDir, p);
                });
            }

            instance = new LessCluster(instanceConfig);

            instance.once("start", function (toProcess, toRead) {
                results.filesToProcess = toProcess;
                results.filesToRead = toRead;
                done();
            });

            instance.collect();
        });

        expectFiles("filesToProcess", results, config.toProcess);
        expectFiles("filesToRead", results, config.toRead || config.toProcess);
    });
}
