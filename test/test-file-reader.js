/**
Tests for the main class
**/
var assert = require('assert');
var readFiles = require('../lib/read-files');

module.exports = {
    "options": {
        "files should be required": function () {
            assert.throws(function () {
                /*jshint nonew: false */
                new readFiles.FileReader();
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
                /*jshint nonew: false */
                new readFiles.FileReader(['a']);
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
    },

    "factory": {
        "should allow (files)": function () {
            assert.doesNotThrow(function () { readFiles([]); });
        },
        "should allow (files, cb)": function (done) {
            readFiles([], function (err, data) {
                assert.ifError(err);
                assert.deepEqual(data, {});
                done();
            });
        },
        "should allow (files, options, cb)": function () {
            var instance = readFiles([], { batchCount: 1 }, function (err, data) {
                assert.ifError(err);
                assert.deepEqual(data, {});
            });
            assert.strictEqual(instance.batchCount, 1);
        }
    },

    "should collect files asynchronously": function () {
        var basedir = __dirname + '/fixtures/file-reader/';
        var inputFiles = [
            basedir + 'a.less',
            basedir + 'b.less',
            basedir + 'c.less'
        ];

        readFiles(Array.prototype.slice.call(inputFiles), function (err, data) {
            assert.ifError(err);

            // must sort to ensure async order matches input
            Object.keys(data).sort().forEach(function (datum, idx) {
                // the test fixtures are empty files
                assert.ok(data[datum] === '');
                // the keys are the filepaths
                assert.strictEqual(datum, inputFiles[idx]);
            });
        });
    }
};
