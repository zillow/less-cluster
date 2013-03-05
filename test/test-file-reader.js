/**
Tests for the file reader
**/
var assert = require('assert');
var vows = require('vows');

var readFiles = require('../lib/read-files');
var suite = vows.describe('FileReader');

suite.addBatch({
    "options": {
        "files should be required": function () {
            assert.throws(function () {
                readFiles.FileReader();
            }, "Must pass an array of files to read.");
        },
        "files should be stored in property": function () {
            var instance = new readFiles.FileReader(['a']);

            assert.ok(instance.hasOwnProperty('files'));
            assert.strictEqual(instance.files.length, 1);
            assert.strictEqual(instance.files[0], 'a');
        },
        "encoding, batchCount, and callback should be optional": function () {
            assert.doesNotThrow(function () {
                readFiles.FileReader(['a']);
            });
        },
        "encoding should default to 'utf8'": function () {
            var instance = new readFiles.FileReader(['a']);

            assert.ok(instance.hasOwnProperty('encoding'));
            assert.strictEqual(instance.encoding, 'utf8');
        },
        "batchCount should default to 100": function () {
            var instance = new readFiles.FileReader(['a']);

            assert.ok(instance.hasOwnProperty('batchCount'));
            assert.strictEqual(instance.batchCount, 100);
        },
        "callback should default to noop": function () {
            var instance = new readFiles.FileReader(['a']);

            assert.ok(instance.hasOwnProperty('callback'));
            assert.strictEqual(instance.callback, readFiles.FileReader.noop);
        }
    }
});

suite.addBatch({
    "readFiles": {
        "called with (files)": {
            topic: function () {
                return readFiles([]);
            },
            "returns instance": function (topic) {
                assert.instanceOf(topic, readFiles.FileReader);
            }
        },
        "called with (files, cb)": {
            topic: function () {
                readFiles([], this.callback);
            },
            "should not error": function (err, data) {
                assert.ifError(err);
            },
            "should return empty data": function (err, data) {
                assert.deepEqual(data, {});
            }
        },
        "called with (files, options, cb)": {
            topic: function () {
                return readFiles([], { batchCount: 1 }, function () {});
            },
            "should preserve options": function (topic) {
                assert.strictEqual(topic.batchCount, 1);
            }
        },

        "with missing files": {
            topic: function () {
                var basedir = __dirname + '/fixtures/file-reader/';
                readFiles([basedir + 'z.less'], this.callback);
            },
            "should send error to callback": function (err, data) {
                assert.isObject(err);
                assert.isUndefined(data);
            }
        },

        "with valid files": {
            topic: function () {
                var basedir = __dirname + '/fixtures/file-reader/';
                return [
                    basedir + 'a.less',
                    basedir + 'b.less',
                    basedir + 'c.less'
                ];
            },
            "asynchronously collected": {
                topic: function (inputFiles) {
                    readFiles(inputFiles.slice(), this.callback.bind(this));
                },
                "should succeed": function (err, data) {
                    assert.ifError(err);

                    var inputFiles = this.context.topics.pop(); // hacktastic!

                    // must sort to ensure async order matches input
                    Object.keys(data).sort().forEach(function (datum, idx) {
                        // the test fixtures are empty files
                        assert.ok(data[datum] === '');
                        // the keys are the filepaths
                        assert.strictEqual(datum, inputFiles[idx]);
                    });
                }
            }
        }
    }
});

suite["export"](module);
