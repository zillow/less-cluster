/*global describe, it, before, beforeEach, after, afterEach, chai, should, sinon */
/**
Tests for the main class
**/
var path = require('path');

var LessCluster = require('../');
var Master = LessCluster.Master;

describe("Cluster Master", function () {
    /*jshint expr:true */

    describe("Lifecycle", function () {
        describe("factory", function () {
            /*jshint newcap: false */
            var topic = Master();

            it("should instantiate without 'new'", function () {
                topic.should.be.instanceof(Master);
            });
        });
        describe("instance", function () {
            var topic = new Master();

            it("should instantiate safely with no config", function () {
                topic.should.be.instanceof(Master);
            });
            it("should inherit LessCluster", function () {
                topic.should.be.instanceof(LessCluster);
            });
            describe("destroy()", function () {
                it("should call _detachEvents", function () {
                    var instance = new Master();
                    var stub = sinon.stub(instance, "_detachEvents");
                    instance.destroy();
                    stub.should.have.been.calledOnce;
                    stub.restore();
                });
            });
        });
    });

    describe("Methods", function () {
        describe("forkWorkers()", function () {
            var result = {};
            before(function (done) {
                var instance = new Master({
                    workers: 0
                });

                instance.forkWorkers(function (err) {
                    result.err = err;
                    done();
                });
            });
            it("should execute provided callback", function () {
                should.not.exist(result.err);
            });
        });
        describe("run()", function () {
            it("should call collect() without arguments", function () {
                var instance = new Master({ workers: 0 });
                var setupMaster = sinon.stub(instance, "setupMaster");
                var collect = sinon.stub(instance, "collect");

                instance.run();

                setupMaster.should.have.been.calledOnce;
                collect.should.have.been.calledWithExactly();
            });
            it("should call setupMaster() with exec path", function () {
                var instance = new Master({ workers: 0 });
                var setupMaster = sinon.stub(instance, "setupMaster");
                var collect = sinon.stub(instance, "collect");

                instance.run();

                setupMaster.should.have.been.calledWith({
                    exec: path.resolve(__dirname, '../lib/worker.js')
                });
            });
            it("_attachEvents() should fire after cluster.setupMaster()", function () {
                var instance = new Master({ workers: 0 });
                var _attachEvents = sinon.stub(instance, "_attachEvents");

                instance.setupMaster();

                _attachEvents.should.have.been.calledOnce;
            });
        });
    });

});
