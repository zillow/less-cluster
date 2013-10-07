/*global describe, it, before, beforeEach, after, afterEach, chai, should, sinon */
/**
Tests for the worker
**/
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
        it("should set _fileData property to an empty object", function () {
            instance.should.have.property('_fileData')
                .that.is.an('object')
                .that.deep.equals({});
        });
    });
    describe("methods", function () {
        describe("_applyConfig()", function () {
            var defaults = LessWorker.defaults;
            var instance = new LessWorker();

            it("defaults values when missing", function () {
                instance._applyConfig();
                instance.options.should.deep.equal(defaults);
            });

            it("overrides defaults when passed", function () {
                instance._applyConfig({
                    'lint': true
                });
                instance.options.should.have.property('lint').that.is.true;
            });
        });
        describe("build()", function () {
            it("TODO");
        });
    });
});
