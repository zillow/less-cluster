/*global describe, it, before, beforeEach, after, afterEach, chai, should, sinon */
/**
Tests for the worker
**/
var LessCluster = require('../');
var ClusterWorker = LessCluster.Worker;

describe("ClusterWorker", function () {
    /*jshint expr:true */

    describe("factory", function () {
        it("should instantiate without 'new'", function () {
            /*jshint newcap: false */
            var instance = ClusterWorker();
            instance.should.be.instanceof(ClusterWorker);
        });
    });
    describe("instance", function () {
        it("should instantiate as constructor", function () {
            var instance = new ClusterWorker();
            instance.should.be.instanceof(ClusterWorker);
        });
    });

    describe("event handling", function () {
        var instance = new ClusterWorker();

        it("should listen to 'message' on process", function () {
            // workers listen to events on process
            process.listeners('message').should.have.length.above(0);
        });
        it("should pass lifecycle events through to sendMaster", function () {
            var consoleError = sinon.stub(console, "error");
            var sendMaster = sinon.stub(instance, "sendMaster");

            // 'emit' returns true if there were listeners
            instance.emit('drain').should.be.true;
            instance.emit('error').should.be.true;
            instance.emit('ready').should.be.true;

            sendMaster.should.have.been.calledThrice;
            consoleError.should.have.been.calledOnce; // from emit('error')

            sendMaster.restore();
            consoleError.restore();
        });
    });

    describe("methods", function () {
        describe("dispatchMessage()", function () {
            var instance = new ClusterWorker();

            it("should require message object", function () {
                should.Throw(function () {
                    instance.dispatchMessage();
                }, "Message must have command");
            });
            it("should require message object with 'cmd'", function () {
                should.Throw(function () {
                    instance.dispatchMessage({
                        foo: 'foo'
                    });
                }, "Message must have command");
            });
            it("should reject invalid commands", function () {
                should.Throw(function () {
                    instance.dispatchMessage({
                        cmd: 'missing'
                    });
                }, "Message command invalid");
            });
            it("should execute build command", function () {
                var build = sinon.stub(instance, "build");
                var msg = {
                    cmd: "build"
                };

                instance.dispatchMessage(msg);

                build.should.have.been.calledWith(msg);
                build.restore();
            });
            it("should execute start command", function () {
                var start = sinon.stub(instance, "start");
                var msg = {
                    cmd: "start"
                };

                instance.dispatchMessage(msg);

                start.should.have.been.calledWith(msg);
                start.restore();
            });
        });
    });
});
