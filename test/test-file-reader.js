/**
Tests for the main class
**/
var readFiles = require('../lib/read-files');

module.exports = {
    "options": {
        "files should be required": function (test) {
            test.expect(1);
            test.throws(function () {
                /*jshint nonew: false */
                new readFiles.FileReader();
            }, "Must pass an array of files to read.");
            test.done();
        },
        "files should be stored in property": function (test) {
            test.expect(3);

            var instance = new readFiles.FileReader(['a']);

            test.ok(instance.hasOwnProperty('files'));
            test.strictEqual(instance.files.length, 1);
            test.strictEqual(instance.files[0], 'a');

            test.done();
        },
        "encoding, batchCount, and callback should be optional": function (test) {
            test.expect(1);
            test.doesNotThrow(function () {
                /*jshint nonew: false */
                new readFiles.FileReader(['a']);
            });
            test.done();
        },
        "encoding should default to 'utf8'": function (test) {
            test.expect(2);

            var instance = new readFiles.FileReader(['a']);

            test.ok(instance.hasOwnProperty('encoding'));
            test.strictEqual(instance.encoding, 'utf8');

            test.done();
        },
        "batchCount should default to 100": function (test) {
            test.expect(2);

            var instance = new readFiles.FileReader(['a']);

            test.ok(instance.hasOwnProperty('batchCount'));
            test.strictEqual(instance.batchCount, 100);

            test.done();
        },
        "callback should default to noop": function (test) {
            test.expect(2);

            var instance = new readFiles.FileReader(['a']);

            test.ok(instance.hasOwnProperty('callback'));
            test.strictEqual(instance.callback, readFiles.FileReader.noop);

            test.done();
        }
    },

    "factory": {
        "should allow (files)": function (test) {
            test.expect(1);
            test.doesNotThrow(function () { readFiles([]); });
            test.done();
        },
        "should allow (files, cb)": function (test) {
            test.expect(2);

            readFiles([], function (err, data) {
                test.ifError(err);
                test.deepEqual(data, {});
                test.done();
            });
        },
        "should allow (files, options, cb)": function (test) {
            test.expect(3);

            var instance = readFiles([], { batchCount: 1 }, function (err, data) {
                test.ifError(err);
                test.deepEqual(data, {});
            });
            test.strictEqual(instance.batchCount, 1);

            test.done();
        }
    },

    "should collect files asynchronously": function (test) {
        var basedir = __dirname + '/fixtures/file-reader/';
        var inputFiles = [
            basedir + 'a.less',
            basedir + 'b.less',
            basedir + 'c.less'
        ];

        test.expect(7);

        readFiles(Array.prototype.slice.call(inputFiles), function (err, data) {
            test.ifError(err);

            // must sort to ensure async order matches input
            Object.keys(data).sort().forEach(function (datum, idx) {
                // the test fixtures are empty files
                test.ok(data[datum] === '');
                // the keys are the filepaths
                test.strictEqual(datum, inputFiles[idx]);
            });

            test.done();
        });
    }
};
