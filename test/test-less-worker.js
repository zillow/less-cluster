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
        describe("start()", function () {
            it("should read all the files specified");
        });

        describe("doneWrote()", function () {
            it("should emit an error if present");
            it("should emit drain when successful");
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
