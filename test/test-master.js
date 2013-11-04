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

    describe("Handler", function () {
        beforeEach(function () {
            this.instance = new Master();
            sinon.stub(this.instance, "debug");
        });
        afterEach(function () {
            this.instance.destroy();
            this.instance = null;
        });

        describe("for cluster event", function () {
            beforeEach(function () {
                this.instance._bindCluster();
                this.worker = {
                    on: sinon.stub(),
                    id: 1
                };
            });
            afterEach(function () {
                this.worker = null;
            });

            describe("'fork'", function () {
                it("should log activity", function () {
                    cluster.emit("fork", this.worker);
                    this.instance.debug.should.be.calledWith("worker[1] forked.");
                });
            });

            describe("'online'", function () {
                it("should log activity", function () {
                    cluster.emit("online", this.worker);
                    this.instance.debug.should.be.calledWith("worker[1] online.");
                });

                it("should bind worker 'message' event", function () {
                    cluster.emit("online", this.worker);
                    this.worker.on.should.be.calledWith("message", sinon.match.func);
                });
            });

            describe("'disconnect'", function () {
                it("should log activity", function () {
                    cluster.emit("disconnect", this.worker);
                    this.instance.debug.should.be.calledWith("worker[1] disconnected.");
                });
            });

            describe("'exit'", function () {
                beforeEach(function () {
                    sinon.stub(cluster, "fork");
                });
                afterEach(function () {
                    cluster.fork.restore();
                });

                it("should log activity", function () {
                    this.worker.suicide = true;
                    cluster.emit("exit", this.worker);
                    this.instance.debug.should.be.calledWith("worker[1] exited.");
                });

                it("should not fork another worker when exit was a suicide", function () {
                    this.worker.suicide = true;
                    cluster.emit("exit", this.worker);
                    cluster.fork.should.not.be.called;
                });

                it("should fork another worker when exit was unexpected", function () {
                    sinon.stub(this.instance, "warn");
                    this.worker.suicide = false;
                    cluster.emit("exit", this.worker);
                    cluster.fork.should.be.calledOnce;
                    this.instance.warn.should.be.calledOnce;
                });
            });
        });

        describe("for process event", function () {
            beforeEach(function () {
                sinon.stub(cluster, "disconnect");
                this.instance._bindProcess();
            });
            afterEach(function () {
                cluster.disconnect.restore();
            });

            describe("'SIGINT'", function () {
                it("should call cluster.disconnect", function () {
                    process.emit("SIGINT");
                    cluster.disconnect.should.be.calledOnce;
                });
            });

            describe("'SIGTERM'", function () {
                it("should call cluster.disconnect", function () {
                    process.emit("SIGTERM");
                    cluster.disconnect.should.be.calledOnce;
                });
            });
        });

        describe("for instance event", function () {
            beforeEach(function () {
                this.instance._bindWorkers();
            });

            describe("'drain'", function () {
                beforeEach(function () {
                    this.instance.removeAllListeners("empty");
                    sinon.stub(this.instance, "getNextFile");
                });

                describe("with files remaining", function () {
                    it("should call buildFile() with appropriate arguments", function () {
                        this.instance.getNextFile.returns("foo.less");
                        sinon.stub(this.instance, "buildFile");
                        this.instance.emit("drain", 1);
                        this.instance.buildFile.should.be.calledWith(1, "foo.less");
                    });
                });

                describe("with no files remaining", function () {
                    it("should emit 'empty' event", function () {
                        this.instance.getNextFile.returns(false);
                        sinon.spy(this.instance, "emit");
                        this.instance.emit("drain", 1);
                        this.instance.emit.should.be.calledWith("empty", 1);
                    });
                });
            });

            describe("'empty'", function () {
                beforeEach(function () {
                    this.instance.removeAllListeners("finished");
                    sinon.spy(this.instance, "emit");
                });

                describe("with running workers remaining", function () {
                    it("should not emit 'finished' event", function () {
                        this.instance.running = 4;
                        this.instance.emit("empty", 1);
                        this.instance.emit.should.not.be.calledWith("finished");
                    });
                });

                describe("with no running workers remaining", function () {
                    it("should emit 'finished' event", function () {
                        this.instance.running = 1;
                        this.instance.emit("empty", 1);
                        this.instance.emit.should.be.calledWith("finished");
                    });
                });
            });

            describe("'finished'", function () {
                it("should call cluster.disconnect", function () {
                    sinon.stub(cluster, "disconnect");
                    this.instance.emit("finished");
                    cluster.disconnect.should.be.calledOnce;
                    cluster.disconnect.restore();
                });
            });
        });

        describe("for message event", function () {
            describe("with malformed message", function () {
                it("should log an error when 'evt' property missing", function () {
                    sinon.stub(this.instance, "error");
                    var badMessage = { foo: "foo" };
                    this.instance.onMessage(badMessage);
                    this.instance.error.should.be.calledWith(badMessage);
                });
            });

            describe("'ready'", function () {
                beforeEach(function () {
                    this.instance.readied = 0;
                });

                it("should track worker readiness", function () {
                    this.instance.onMessage({ evt: "ready" });
                    this.instance.readied.should.equal(1);
                });

                it("should run queue when all workers are ready", function () {
                    sinon.stub(this.instance, "runQueue");
                    this.instance.options.workers = 1;
                    this.instance.onMessage({ evt: "ready" });
                    this.instance.runQueue.should.be.calledOnce;
                });
            });

            describe("'drain'", function () {
                it("should emit 'drain' on instance", function () {
                    sinon.stub(this.instance, "emit");
                    this.instance.onMessage({ evt: "drain", id: 1 });
                    this.instance.emit.should.be.calledWith("drain", 1);
                });
            });

            describe("'error'", function () {
                it("should call process.exit with error code 1", function () {
                    sinon.stub(process, "exit");
                    sinon.stub(cluster, "disconnect").yields();

                    this.instance.onMessage({ evt: "error" });

                    process.exit.should.be.calledWith(1);
                    process.exit.restore();
                    cluster.disconnect.restore();
                });
            });
        });
    });
});
