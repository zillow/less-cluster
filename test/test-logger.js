/*global describe, it, before, beforeEach, after, afterEach, chai, should, sinon */
/**
Tests for the logger mixin
**/
var inherits = require('util').inherits;
var Logger = require('../lib/logger');

describe('Logger', function () {
    /*jshint expr:true */

    describe("##mixin()", function () {
        function Super() {}
        Super.prototype.log = function () {
            this.logged = "super";
        };

        function Klass(options) {
            Super.call(this);
            Logger.call(this, options);
        }

        inherits(Klass, Super);
        Logger.mixin(Klass);

        var topic = {
            Super: Super,
            Klass: Klass
        };

        it("should provide all methods", function () {
            var instance = new topic.Klass();
            instance.should.respondTo('debug');
            instance.should.respondTo('log');
            instance.should.respondTo('warn');
            instance.should.respondTo('error');
        });
        it("should shadow superclass methods", function () {
            var consoleLog = sinon.stub(console, "log");
            var instance = new topic.Klass();
            instance.log();
            should.not.exist(instance.logged);
            consoleLog.should.have.been.calledOnce;
            consoleLog.restore();
        });
    });

    describe("debug()", function () {
        it("should NOT emit without --verbose", function () {
            var consoleLog = sinon.stub(console, "log");
            var topic = new Logger();
            topic.debug("FAIL");
            consoleLog.should.not.have.been.called;
            consoleLog.restore();
        });
        describe("when --verbose", function () {
            it("should emit", function () {
                var consoleLog = sinon.stub(console, "log");
                var topic = new Logger({
                    verbose: true
                });
                topic.debug("PASS");
                consoleLog.should.have.been.calledWith("PASS");
                consoleLog.restore();
            });
        });
    });

    describe("log()", function () {
        it("should emit", function () {
            var consoleLog = sinon.stub(console, "log");
            var topic = new Logger();
            topic.log("PASS");
            consoleLog.should.have.been.calledWith("PASS");
            consoleLog.restore();
        });
        describe("when --quiet", function () {
            it("should NOT emit", function () {
                var consoleLog = sinon.stub(console, "log");
                var topic = new Logger({
                    quiet: true
                });
                topic.log("FAIL");
                consoleLog.should.not.have.been.called;
                consoleLog.restore();
            });
        });
    });

    describe("warn()", function () {
        it("should emit", function () {
            var consoleError = sinon.stub(console, "error");
            var topic = new Logger();
            topic.warn("PASS");
            consoleError.should.have.been.calledWith("PASS");
            consoleError.restore();
        });
        describe("when --quiet", function () {
            it("should NOT emit", function () {
                var consoleError = sinon.stub(console, "error");
                var topic = new Logger({
                    quiet: true
                });
                topic.warn("FAIL");
                consoleError.should.not.have.been.called;
                consoleError.restore();
            });
        });
    });

    describe("error()", function () {
        it("should emit", function () {
            var consoleError = sinon.stub(console, "error");
            var topic = new Logger();
            topic.error("PASS");
            consoleError.should.have.been.calledWith("PASS");
            consoleError.restore();
        });
        describe("when", function () {
            describe("--quiet", function () {
                it("should emit", function () {
                    var consoleError = sinon.stub(console, "error");
                    var topic = new Logger({
                        quiet: true
                    });
                    topic.error("PASS");
                    consoleError.should.have.been.calledWith("PASS");
                    consoleError.restore();
                });
            });
            describe("--silent", function () {
                it("should NOT emit", function () {
                    var consoleError = sinon.stub(console, "error");
                    var topic = new Logger({
                        silent: true
                    });
                    topic.error("FAIL");
                    consoleError.should.not.have.been.called;
                    consoleError.restore();
                });
            });
        });
    });
});
