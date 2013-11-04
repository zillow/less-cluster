/*global describe, it, before, beforeEach, after, afterEach, chai, should, sinon */
/**
Tests for the main class
**/
var path = require('path');
var cluster = require('cluster');

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
        });
    });

    describe("Method", function () {
        describe("destroy()", function () {
            it("should emit 'cleanup'", function (done) {
                var instance = new Master();

                instance.once("cleanup", done);
                instance.destroy();
            });

            it("should exit with error code when provided", function () {
                var instance = new Master();
                sinon.stub(process, "exit");

                instance.destroy(1);

                process.exit.should.have.been.calledWithExactly(1);
                process.exit.restore();
            });
        });

        describe("setupMaster()", function () {
            beforeEach(function () {
                sinon.stub(cluster, "once");
                sinon.stub(cluster, "setupMaster");
                this.instance = new Master();
            });
            afterEach(function () {
                cluster.once.restore();
                cluster.setupMaster.restore();
                this.instance = null;
            });

            it("should hook cluster 'setup' event", function () {
                this.instance.setupMaster();

                cluster.once.should.have.been.calledWith("setup", sinon.match.func);
            });

            it("should pass options to cluster.setupMaster", function () {
                var options = { exec: "worker.js" };

                this.instance.setupMaster(options);

                cluster.setupMaster.should.have.been.calledWith(options);
            });
        });

        describe("forkWorkers()", function () {
            beforeEach(function () {
                sinon.stub(cluster, "fork");
                this.instance = new Master({ workers: 1 });
            });
            afterEach(function () {
                cluster.fork.restore();
                this.instance = null;
            });

            it("should fork configured number of workers", function () {
                this.instance.forkWorkers();
                cluster.fork.should.have.been.calledOnce;
            });

            it("should execute provided callback", function (done) {
                this.instance.forkWorkers(done);
            });
        });

        describe("run()", function () {
            beforeEach(function () {
                this.instance = new Master();
                sinon.stub(this.instance, "setupMaster");
                sinon.stub(this.instance, "forkWorkers");
            });
            afterEach(function () {
                this.instance.emit("cleanup");
                this.instance = null;
            });

            it("should not proceed when cluster.isMaster == false", function () {
                cluster.isMaster = false;
                this.instance.run();
                cluster.isMaster = true;

                this.instance.setupMaster.should.not.have.been.called;
                this.instance.forkWorkers.should.not.have.been.called;
            });

            it("should call setupMaster() with exec path", function () {
                this.instance.run();

                this.instance.setupMaster.should.have.been.calledOnce;
                this.instance.setupMaster.should.have.been.calledWith({
                    exec: path.resolve(__dirname, '../lib/worker.js')
                });
            });

            it("should bind collect() as forkWorkers callback", function () {
                sinon.stub(this.instance, "collect");

                this.instance.forkWorkers.yields();
                this.instance.run();

                this.instance.collect.should.have.been.calledOnce;
            });
        });
    });

    describe("Events", function () {
        beforeEach(function () {
            this.instance = new Master();
            sinon.stub(this.instance, "forkWorkers");

            // spy instance methods to allow execution
            sinon.spy(this.instance, "on");
            sinon.spy(this.instance, "removeAllListeners");

            sinon.stub(cluster, "on");
            sinon.stub(process, "on");

            sinon.stub(cluster, "removeListener");
            sinon.stub(process, "removeListener");

            sinon.stub(cluster, "setupMaster");
            sinon.stub(cluster, "once").yields();
            // calls the "setup" handler immediately
        });
        afterEach(function () {
            cluster.setupMaster.restore();
            cluster.once.restore();

            cluster.on.restore();
            process.on.restore();

            cluster.removeListener.restore();
            process.removeListener.restore();

            this.instance = null;
        });

        it("should bind after setup", function () {
            this.instance.run();

            cluster.on.callCount.should.equal(4);
            cluster.on.should.be.calledWith("fork",       sinon.match.func);
            cluster.on.should.be.calledWith("online",     sinon.match.func);
            cluster.on.should.be.calledWith("disconnect", sinon.match.func);
            cluster.on.should.be.calledWith("exit",       sinon.match.func);

            process.on.callCount.should.equal(2);
            process.on.should.be.calledWith("SIGINT",  sinon.match.func);
            process.on.should.be.calledWith("SIGTERM", sinon.match.func);

            // "this.on" count (3) includes "this.once" count (3)
            this.instance.on.callCount.should.equal(6);
            this.instance.on.should.be.calledWith("drain",    sinon.match.func);
            this.instance.on.should.be.calledWith("empty",    sinon.match.func);
            this.instance.on.should.be.calledWith("finished", sinon.match.func);
        });

        it("should unbind after cleanup", function () {
            this.instance.run();
            this.instance.emit("cleanup");

            cluster.removeListener.callCount.should.equal(4);
            cluster.removeListener.should.be.calledWith("fork",       sinon.match.func);
            cluster.removeListener.should.be.calledWith("online",     sinon.match.func);
            cluster.removeListener.should.be.calledWith("disconnect", sinon.match.func);
            cluster.removeListener.should.be.calledWith("exit",       sinon.match.func);

            process.removeListener.callCount.should.equal(2);
            process.removeListener.should.be.calledWith("SIGINT",  sinon.match.func);
            process.removeListener.should.be.calledWith("SIGTERM", sinon.match.func);

            this.instance.removeAllListeners.callCount.should.equal(3);
            this.instance.removeAllListeners.should.be.calledWith("drain");
            this.instance.removeAllListeners.should.be.calledWith("empty");
            this.instance.removeAllListeners.should.be.calledWith("finished");
        });
    });
});
