/*global describe, it, before, beforeEach, after, afterEach, chai, should, sinon */
/**
Tests for the worker
**/
var fs = require('graceful-fs');
var path = require('path');
var less = require('less');
var rimraf = require('rimraf');
var LessWorker = require('../lib/less-worker');

describe('LessWorker', function () {
    /*jshint expr:true */

    describe("factory", function () {
        /*jshint newcap: false */
        var instance = LessWorker();

        it("should instantiate without 'new'", function () {
            instance.should.be.an.instanceof(LessWorker);
        });
    });

    describe("instance", function () {
        var instance = new LessWorker();

        it("should instantiate as constructor", function () {
            instance.should.be.an.instanceof(LessWorker);
        });

        it("should create private caches as empty objects", function () {
            instance.should.have.property('_fileCache').that.deep.equals({});
            instance.should.have.property('_pathCache').that.deep.equals({});
            instance.should.have.property('_pathRebase').that.deep.equals({});
        });

        it("should default options when missing", function () {
            instance.options.should.deep.equal(LessWorker.defaults);
        });

        describe("destroy()", function () {
            before(function () {
                sinon.spy(instance, "emit");
                sinon.spy(instance, "removeAllListeners");
                instance.destroy();
            });

            it("should nullify private caches", function () {
                instance.should.have.property('_fileCache').that.is.null;
                instance.should.have.property('_pathCache').that.is.null;
                instance.should.have.property('_pathRebase').that.is.null;
            });

            it("should emit 'cleanup' event", function () {
                instance.emit.should.have.been.calledWith("cleanup");
            });

            it("should remove all listeners", function () {
                instance.removeAllListeners.should.have.been.calledOnce;
            });

            it("should restore original less.Parser.fileLoader");
            // this is hard to assert that it actually happened...
        });

        describe("with options", function () {
            var fileDataCache = {
                "foo.less": "foo"
            };

            before(function () {
                this.instance = new LessWorker({
                    lint: true
                }, fileDataCache);
            });
            after(function () {
                this.instance.destroy();
            });

            it("should override defaults when passed", function () {
                this.instance.options.should.have.property('lint').that.is.true;
            });

            it("should update cache when fileData passed", function () {
                this.instance.should.have.property("_fileCache").that.equals(fileDataCache);

                // the object stored in _fileCache is literally the same object passed in
                fileDataCache.bar = "bar";
                this.instance._fileCache.should.equal(fileDataCache);
            });
        });
    });

    describe("method", function () {
        var fileName = "a.less";
        var filePath = path.resolve(__dirname, "fixtures/imports/included", fileName);
        var fileData = "foo"; // file is actually empty, but we never actually read it

        var childImportName = "modules/parent.less";
        var childImportPath = path.resolve(__dirname, "fixtures/imports", childImportName);
        var parentFilePath  = path.resolve(__dirname, "fixtures/imports/base.less");

        var ohNoesError = "oh noes!";
        var outputdir = path.resolve(__dirname, "output");

        // simulating --include-path arguments
        var envPaths = [path.dirname(filePath)];

        beforeEach(function () {
            this.instance = new LessWorker({
                outputdir: outputdir
            });
        });
        afterEach(function () {
            this.instance.destroy();
            this.instance = null;
        });

        describe("doneWrote()", function () {
            beforeEach(function () {
                sinon.stub(this.instance, "emit");
                sinon.stub(this.instance, "log");
            });
            afterEach(function () {
                this.instance.emit.restore();
                this.instance.log.restore();
            });

            it("should emit an error if present", function () {
                this.instance.doneWrote(filePath, ohNoesError);
                this.instance.emit.should.have.been.calledWith("error", ohNoesError);
            });

            it("should emit drain when successful", function () {
                this.instance.doneWrote(filePath);
                this.instance.log.should.have.been.calledOnce;
                this.instance.emit.should.have.been.calledWith("drain", filePath);
            });
        });

        describe("inDir()", function () {
            beforeEach(function () {
                sinon.stub(this.instance, "emit");
                sinon.stub(this.instance, "doneWrote");
                sinon.stub(fs, "writeFile");
            });
            afterEach(function () {
                this.instance.emit.restore();
                this.instance.doneWrote.restore();
                fs.writeFile.restore();
            });

            it("should emit an error if present", function () {
                this.instance.inDir(filePath, fileData, ohNoesError);
                this.instance.emit.should.have.been.calledWith("error", ohNoesError);
                fs.writeFile.should.not.have.been.called;
            });

            it("should write data into filename", function () {
                fs.writeFile.yields();
                this.instance.inDir(filePath, fileData, null);
                this.instance.doneWrote.should.have.been.calledOnce;
                fs.writeFile.should.have.been.calledWith(filePath, fileData, "utf8", sinon.match.func);
            });
        });

        describe("writeOutput()", function () {
            beforeEach(function () {
                sinon.stub(this.instance, "emit");
                sinon.stub(this.instance, "warn");
                sinon.stub(this.instance, "inDir");
                // mkdirp calls fs.mkdir under the covers
                sinon.stub(fs, "mkdir");
            });
            afterEach(function () {
                this.instance.emit.restore();
                this.instance.warn.restore();
                this.instance.inDir.restore();
                fs.mkdir.restore();
            });

            it("should skip writing if data empty, draining immediately", function () {
                this.instance.writeOutput(filePath, "");
                this.instance.warn.should.have.been.calledOnce;
                this.instance.emit.should.have.been.calledWith("drain", filePath);
                this.instance.inDir.should.not.have.been.called;
                fs.mkdir.should.not.have.been.called;
            });

            it("should ensure directory exists before writing", function () {
                fs.mkdir.yields(null); // success
                this.instance.writeOutput(filePath, fileData);
                fs.mkdir.should.have.been.calledWith(path.dirname(filePath));
                this.instance.inDir.should.have.been.calledWith(filePath, fileData, null);
            });
        });

        describe("resolveChildPath()", function () {
            beforeEach(function () {
                sinon.stub(fs, "existsSync");
            });
            afterEach(function () {
                fs.existsSync.restore();
            });

            describe("when cache is hot", function () {
                beforeEach(function () {
                    this.instance._pathCache[fileName] = filePath;
                });

                it("should early return cached childPath", function () {
                    var result = this.instance.resolveChildPath(fileName, parentFilePath, []);
                    fs.existsSync.should.not.have.been.called;
                    result.should.equal(filePath);
                });
            });

            describe("when cache is cold", function () {
                beforeEach(function () {
                    fs.existsSync.withArgs(filePath).returns(true);
                    fs.existsSync.withArgs(childImportPath).returns(true);
                });

                it("should cache a successful lookup", function () {
                    this.instance
                        .resolveChildPath(childImportName, parentFilePath, envPaths)
                            .should.equal(childImportPath);

                    fs.existsSync.should.have.been.calledOnce;

                    this.instance._pathCache.should.have.property(childImportName, childImportPath);
                });

                it("should loop over all include paths when locating child", function () {
                    this.instance
                        .resolveChildPath(fileName, parentFilePath, envPaths)
                            .should.equal(filePath);

                    fs.existsSync.should.have.been.calledTwice;
                });

                it("should indicate if the resolved path has been rebased", function () {
                    this.instance.resolveChildPath(childImportName, parentFilePath, envPaths);
                    this.instance.resolveChildPath(fileName,        parentFilePath, envPaths);

                    fs.existsSync.should.have.been.calledThrice;

                    this.instance._pathRebase.should.have.property(childImportName, false);
                    this.instance._pathRebase.should.have.property(fileName,         true);
                });

                it("should throw error when lookup fails?");
            });
        });

        describe("rebaseRootPath()", function () {
            describe("when staying inside parent directory", function () {
                it("should not rebase sibling rootpath", function () {
                    var childFileInfo = {
                        "currentDirectory"  : __dirname + "/fixtures/imports/",
                        "entryPath"         : __dirname + "/fixtures/imports/",
                        "filename"          : __dirname + "/fixtures/imports/external.css",
                        "rootFilename"      : __dirname + "/fixtures/imports/base.less",
                        "rootpath"          : ""
                    };
                    this.instance.rebaseRootPath("external.css", parentFilePath, childFileInfo);
                    childFileInfo.rootpath.should.equal("");
                });

                it("should rebase relative from root file source path", function () {
                    var childFileInfo = {
                        "currentDirectory"  : __dirname + "/fixtures/imports/modules/",
                        "entryPath"         : __dirname + "/fixtures/imports/",
                        "filename"          : __dirname + "/fixtures/imports/modules/parent.less",
                        "rootFilename"      : __dirname + "/fixtures/imports/base.less",
                        "rootpath"          : ""
                    };
                    this.instance.rebaseRootPath(childImportName, parentFilePath, childFileInfo);
                    childFileInfo.rootpath.should.equal("modules/");
                });
            });

            describe("when traversing outside parent directory", function () {
                beforeEach(function () {
                    this.instance._pathRebase[fileName] = true;
                });

                it("should rebase relative from destination path", function () {
                    var childFileInfo = {
                        "currentDirectory"  : __dirname + "/fixtures/imports/included/",
                        "filename"          : __dirname + "/fixtures/imports/included/a.less",
                        "entryPath"         : __dirname + "/fixtures/imports/",
                        "rootFilename"      : __dirname + "/fixtures/imports/base.less",
                        "destPath"          : __dirname + "/fixtures/output",
                        "rootpath"          : ""
                    };
                    this.instance.rebaseRootPath(fileName, parentFilePath, childFileInfo);
                    childFileInfo.rootpath.should.equal("../imports/included/");
                });
            });
        });

        describe("build()", function () {
            var expectedFilePath = path.resolve(__dirname, "fixtures", "output", "base.css");
            var compiledFilePath = path.resolve(outputdir, "base.css");

            before(function (done) {
                // read file contents into context variables
                var test = this;
                rimraf(outputdir, function () {
                    fs.readFile(expectedFilePath, "utf8", function (err, data) {
                        test.expectedContent = data;
                        fs.readFile(parentFilePath, "utf8", function (err, data) {
                            test.parentContent = data;
                            done();
                        });
                    });
                });
            });
            beforeEach(function () {
                // populate instance file cache
                this.instance._fileCache = {};
                this.instance._fileCache[parentFilePath] = this.parentContent;
            });

            it("should pass arguments directly to utility method", function () {
                sinon.stub(this.instance, "_build");
                this.instance.build("foo.less", "foo.css");
                this.instance._build.should.be.calledWith("foo.less", "foo.css");
            });

            describe("failure", function () {
                beforeEach(function () {
                    sinon.stub(less, "writeError");
                    sinon.stub(console, "error");
                });
                afterEach(function () {
                    less.writeError.restore();
                    console.error.restore();
                });

                it("should emit error when imported file not found", function (done) {
                    this.instance.once("error", function (err) {
                        should.exist(err);

                        err.should.have.property("type", "Syntax");
                        err.should.have.property("message", "File not found: undefined");

                        less.writeError.should.have.been.calledWith(err, this.options);

                        done();
                    });

                    this.instance.build(parentFilePath, compiledFilePath);
                });

                it("should emit error when tree.toCSS fails", function (done) {
                    // provide correct import paths
                    this.instance.options.paths = envPaths;

                    // we can't effectively mock tree.toCSS, so let's pretend
                    sinon.stub(this.instance, "writeOutput").throws({ type: "Fake" });

                    this.instance.once("error", function (err) {
                        should.exist(err);

                        err.should.have.property("type", "Fake");

                        done();
                    });

                    this.instance.build(parentFilePath, compiledFilePath);
                });
            });

            describe("success", function () {
                beforeEach(function () {
                    // provide correct import paths
                    this.instance.options.paths = envPaths;
                });

                it("should match compiled output", function (done) {
                    var test = this;
                    sinon.stub(console, "log");

                    this.instance.once("error", done);
                    this.instance.once("drain", function (fileName) {
                        should.exist(fileName);
                        fileName.should.equal(compiledFilePath);
                        fs.readFile(fileName, "utf8", function (err, data) {
                            should.exist(data);
                            data.should.equal(test.expectedContent);
                            console.log.should.have.been.calledWith("compiled test/output/base.css");
                            console.log.restore();
                            done();
                        });
                    });

                    this.instance.build(parentFilePath, compiledFilePath);
                });
            });
        });
    });
});
