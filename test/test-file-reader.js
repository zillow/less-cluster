/*global describe, it, before, beforeEach, after, afterEach, chai, should, sinon */
/**
Tests for the file reader
**/
var readFiles = require('../lib/read-files');

describe("ReadFiles", function () {
    /*jshint expr:true */

    describe("option", function () {
        it("'files' should be required", function () {
            should.Throw(function () {
                readFiles.FileReader();
            }, "Must pass an array of files to read.");
        });
        it("'encoding', 'batchCount', and 'callback' should be optional", function () {
            should.not.Throw(function () {
                readFiles.FileReader(['a']);
            });
        });
        it("'files' should be stored in property", function () {
            var instance = new readFiles.FileReader(['a']);
            instance.should.have.property('files')
                .that.deep.equals(['a']);
        });
        describe("default", function () {
            var instance = new readFiles.FileReader(['a']);
            it("'encoding' should be 'utf8'", function () {
                instance.should.have.property('encoding', 'utf8');
            });
            it("'batchCount' should be 100", function () {
                instance.should.have.property('batchCount', 100);
            });
            it("'callback' should be a noop", function () {
                instance.should.have.property('callback', readFiles.FileReader.noop);
            });
        });
    });

    describe("constructor", function () {
        describe("called with (files)", function () {
            var topic = readFiles([]);
            it("returns instance", function () {
                topic.should.be.instanceof(readFiles.FileReader);
            });
        });
        describe("called with (files, cb)", function () {
            var result = {};
            before(function (done) {
                readFiles([], function (err, data) {
                    result.err = err;
                    result.data = data;
                    done();
                });
            });
            it("should not error", function () {
                should.not.exist(result.err);
            });
            it("should return empty data", function () {
                should.exist(result.data);
                result.data.should.deep.equal({});
            });
        });
        describe("called with (files, options, cb)", function () {
            var topic = readFiles([], { batchCount: 1 }, function () {});
            it("should preserve options", function () {
                topic.batchCount.should.equal(1);
            });
        });

        describe("with missing files", function () {
            var result = {};
            before(function (done) {
                var basedir = __dirname + '/fixtures/file-reader/';
                readFiles([basedir + 'z.less'], function (err, data) {
                    result.err = err;
                    result.data = data;
                    done();
                });
            });
            it("should send error to callback", function () {
                should.exist(result.err);
                should.not.exist(result.data);
            });
        });

        describe("with valid files", function () {
            var basedir = __dirname + '/fixtures/file-reader/';
            var inputFiles = [
                basedir + 'a.less',
                basedir + 'b.less',
                basedir + 'c.less'
            ];
            describe("asynchronously collected", function () {
                var result = {};
                before(function (done) {
                    readFiles(inputFiles.slice(), function (err, data) {
                        result.err = err;
                        result.data = data;
                        done();
                    });
                });
                it("should succeed", function () {
                    should.not.exist(result.err);

                    // must sort to ensure async order matches input
                    Object.keys(result.data).sort().forEach(function (datum, idx) {
                        // the test fixtures are empty files
                        result.data[datum].should.equal('');
                        // the keys are the filepaths
                        datum.should.equal(inputFiles[idx]);
                    });
                });
            });
        });
    });
});
