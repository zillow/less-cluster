/*global describe, it, before, beforeEach, after, afterEach, chai, should, sinon */
/**
Tests for the worker
**/
var less = require('less');
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
            instance.should.have.property('_fileData').that.deep.equals({});
            instance.should.have.property('_pathCache').that.deep.equals({});
            instance.should.have.property('_pathRebase').that.deep.equals({});
        });

        it("should default options when missing", function () {
            instance.options.should.deep.equal(LessWorker.defaults);
        });

        it("should override defaults when passed", function () {
            (new LessWorker({ 'lint': true })).options.should.have.property('lint').that.is.true;
        });

        describe("destroy()", function () {
            before(function () {
                sinon.spy(instance, "removeAllListeners");
                instance.destroy();
            });

            it("should nullify private caches", function () {
                instance.should.have.property('_fileData').that.is.null;
                instance.should.have.property('_pathCache').that.is.null;
                instance.should.have.property('_pathRebase').that.is.null;
            });

            it("should remove all listeners", function () {
                instance.removeAllListeners.should.have.been.calledOnce;
            });

            it("should restore original less.Parser.importer");
            // this is hard to assert that it actually happened...
        });
    });

    describe("method", function () {
        beforeEach(function () {
            this.instance = new LessWorker();
        });
        afterEach(function () {
            this.instance.destroy();
            this.instance = null;
        });

        describe("start()", function () {
            var message = { "cmd": "start", "data": ["foo.less"] };

            beforeEach(function () {
                sinon.stub(this.instance, "emit");
                sinon.stub(LessWorker, "readFiles");
            });
            afterEach(function () {
                LessWorker.readFiles.restore();
            });

            it("should read all the files specified in message data", function () {
                this.instance.start(message);
                LessWorker.readFiles.should.have.been.calledWith(message.data, sinon.match.func);
            });

            it("should emit error event when encountered", function () {
                LessWorker.readFiles.yields("oh noes!");
                this.instance.start(message);
                this.instance.emit.should.have.been.calledWith("error", "oh noes!");
            });

            it("should emit ready event when successful", function () {
                var data = { "foo.less": "foo" };
                LessWorker.readFiles.yields(null, data);
                this.instance.start(message);
                this.instance.emit.should.have.been.calledWith("ready");
                this.instance._fileData.should.eql(data);
            });
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
                this.instance.doneWrote("foo.less", "oh noes!");
                this.instance.emit.should.have.been.calledWith("error", "oh noes!");
            });

            it("should emit drain when successful", function () {
                this.instance.doneWrote("foo.less");
                this.instance.log.should.have.been.calledOnce;
                this.instance.emit.should.have.been.calledWith("drain", "foo.less");
            });
        });

        describe("inDir()", function () {
            it("should emit an error if present");
            it("should write data into filename");
        });

        describe("writeOutput()", function () {
            it("should skip writing if data empty");
            it("should ensure directory exists before writing");
        });

        describe("rebaseRootPath()", function () {
            it("TODO");
        });

        describe("build()", function () {
            it("TODO");
        });
    });
});
