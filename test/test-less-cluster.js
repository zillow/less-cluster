/*global describe, it, before, beforeEach, after, afterEach, chai, should, sinon */
/**
Tests for the main class
**/
var fs = require('fs');
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
            instance.removeAllListeners("run");
            instance.should.be.an.instanceof(LessCluster);
        });
    });

    describe("instance", function () {
        var instance;
        before(function (done) {
            sinon.spy(process, "nextTick");
            instance = new LessCluster();
            instance.removeAllListeners("run");
            instance.on("run", done);
        });
        after(function () {
            process.nextTick.restore();
        });

        it("should instantiate safely with no config", function () {
            should.exist(instance);
        });
        it("should emit 'run' event on nextTick", function () {
            process.nextTick.should.have.been.calledWith(sinon.match.func);
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
            instance.should.have.ownProperty('_fileCache', {});
        });
    });

    describe("run()", function () {
        beforeEach(function () {
            // normally called on nextTick, separated here for clarity
            this.instance = new LessCluster();
            this.instance.removeAllListeners("run");
            this.instance.run();
        });
        afterEach(function () {
            this.instance = null;
        });

        it("should instantiate a worker", function () {
            this.instance.should.have.ownProperty("worker");
        });

        it("should hook worker events", function () {
            this.instance.worker.listeners("drain").should.have.length(1);
        });
    });

    describe("destroy()", function () {
        beforeEach(function (done) {
            var test = this;
            test.instance = new LessCluster(function () {
                sinon.stub(test.instance, "removeAllListeners");
                sinon.stub(test.instance.worker, "destroy");

                test.instance.destroy();
                done();
            });
        });
        afterEach(function () {
            this.instance = null;
        });

        it("should unhook all events", function () {
            this.instance.removeAllListeners.should.have.been.calledOnce;
        });

        it("should destroy worker", function () {
            this.instance.worker.destroy.should.have.been.calledOnce;
        });
    });

    describe("getNextFile()", function () {
        beforeEach(function () {
            this.instance = getSafeInstance();
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

    describe("onDrain()", function () {
        beforeEach(function () {
            this.instance = getSafeInstance();

            sinon.stub(this.instance, "getNextFile");
        });
        afterEach(function () {
            this.instance = null;
        });

        it("should pass next available file to buildFile()", function () {
            sinon.stub(this.instance, "buildFile");
            this.instance.getNextFile.returns("foo.less");

            this.instance.onDrain();

            this.instance.buildFile.should.have.been.calledWith("foo.less");
        });

        it("should emit 'finished' event when queue empty", function () {
            sinon.stub(this.instance, "emit");
            this.instance.getNextFile.returns();

            this.instance.onDrain();

            this.instance.emit.should.have.been.calledWith("finished");
        });
    });

    describe("buildFile()", function () {
        beforeEach(function (done) {
            var test = this;
            test.instance = new LessCluster(function () {
                sinon.stub(test.instance.worker, "build");
                done();
            });
        });
        afterEach(function () {
            this.instance.destroy();
            this.instance = null;
        });

        it("should not error when worker missing", function () {
            should.not.Throw(function () {
                getSafeInstance().buildFile("foo.less");
            });
        });

        it("should not call worker.build() when fileName missing", function () {
            this.instance.buildFile();
            this.instance.worker.build.should.not.have.been.called;
        });

        it("should call worker.build() with correct options", function () {
            var fileName = addImportsDir("base.less");
            this.instance.buildFile(fileName);
            this.instance.worker.build.should.have.been.calledWith(fileName, addImportsDir("base.css"));
        });
    });

    describe("collect()", function () {
        var instance;
        before(function () {
            instance = getSafeInstance({
                "directory": importsDir
            });
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
                cb.data.should.include.keys([
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

        describe("variations", function () {
            beforeEach(function () {
                this.instance = getSafeInstance({
                    "directory": importsDir
                });
            });
            afterEach(function () {
                this.instance = null;
            });

            it("should allow callback only", function (done) {
                this.instance.collect(done);
            });

            it("should allow directory override", function (done) {
                this.instance.collect(includeDir, function (err, data) {
                    should.exist(data);
                    data.should.have.property(path.join(includeDir, "a.less"));
                    data.should.have.property(path.join(includeDir, "b.less"));
                    done();
                });
            });

            it("should allow call with no arguments", function (done) {
                sinon.stub(this.instance, "_finishCollect", done);
                this.instance.collect();
            });

            it("should abort glob if error emitted", function (done) {
                sinon.stub(fs, "readdir");

                // yieldsAsync() necessary to pass through internal process.nextTick
                fs.readdir.yieldsAsync({ code: "WTF" });

                this.instance.collect(function (err) {
                    fs.readdir.restore();
                    done();
                });
            });
        });
    });

    describe("unfiltered", function () {
        filtersOutput("default output", {
            "toProcess": [
                "_variables.less",
                "base.less",
                "included/a.less",
                "included/b.less",
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
                "included/b.less",
                "modules/child.less",
                "modules/parent.less",
                "themes/fancy.less",
                "themes/simple.less"
            ]
        });
        filtersOutput("[modules/parent.less]", {
            "toFilter" : ["modules/parent.less"],
            "toProcess": ["modules/parent.less", "base.less"],
            "toRead"   : [
                "_variables.less",
                "base.less",
                "included/a.less",
                "included/b.less",
                "modules/child.less",
                "modules/parent.less",
                "themes/fancy.less",
                "themes/simple.less"
            ]
        });
        filtersOutput("[_variables.less]", {
            "toFilter" : ["_variables.less"],
            "toProcess": [
                "_variables.less",
                "modules/child.less",
                "modules/parent.less",
                "themes/fancy.less"
            ],
            "toRead"   : [
                "_variables.less",
                // TODO: grandparents
                // "base.less",
                "modules/child.less",
                "modules/parent.less",
                "themes/fancy.less",
                "themes/simple.less"
            ]
        });
        filtersOutput("[themes/simple.less]", {
            "toFilter" : ["themes/simple.less"],
            "toProcess": ["themes/simple.less", "modules/child.less"],
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

// return an instance with 'run' event unhooked
function getSafeInstance(options) {
    var instance = new LessCluster(options);
    instance.removeAllListeners("run");
    return instance;
}

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
            actually.should.include.members(absolutized);
        });

        expected.forEach(function (relativePath) {
            it(relativePath, function () {
                var actually = results[subtitle];
                actually.should.include(addImportsDir(relativePath));
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
                instanceConfig.files = relativePaths.map(function (p) {
                    return path.join(importsDir, p);
                });
            }

            instance = getSafeInstance(instanceConfig);

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
