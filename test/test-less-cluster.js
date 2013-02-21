/**
Tests for the main class
**/
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var LessCluster = require('../lib/less-cluster');
var path = require('path');

module.exports = {
    "lifecycle": {
        "should instantiate safely with no config": function () {
            var instance = new LessCluster();
            assert.ok(instance instanceof LessCluster);
        },
        "factory should instantiate without 'new'": function () {
            /*jshint newcap: false */
            var instance = LessCluster();
            assert.ok(instance instanceof LessCluster);
        },
        "should inherit EventEmitter": function (done) {
            var instance = new LessCluster();

            assert.ok(LessCluster.super_ === EventEmitter);
            assert.ok(instance instanceof EventEmitter);

            instance.on('foo', function (bar) {
                assert.strictEqual(bar, 'bar');
                done();
            });
            instance.emit('foo', 'bar');
        },
        "should possess static default options": function () {
            var options = LessCluster.defaults;
            assert.ok(!!options);

            assert.ok(options.hasOwnProperty('match'));
            assert.ok(options.hasOwnProperty('workers'));

            assert.strictEqual(options.match, '**/*.less');
            assert.strictEqual(options.workers, require('os').cpus().length);
        },
        "should default all instance options": function () {
            var instance = new LessCluster();
            assert.ok(instance.hasOwnProperty('options'));

            assert.strictEqual(instance.options.match, '**/*.less');
            assert.strictEqual(instance.options.workers, require('os').cpus().length);
        },
        "instance should setup private caches": function () {
            var instance = new LessCluster();

            assert.ok(instance.hasOwnProperty('_parents'));
            assert.ok(instance.hasOwnProperty('_children'));
            assert.ok(instance.hasOwnProperty('_fileData'));

            assert.deepEqual(instance._parents, {});
            assert.deepEqual(instance._children, {});
            assert.deepEqual(instance._fileData, {});
        },
        "destroy() should call _detachEvents": function (done) {
            var instance = new LessCluster();

            instance._detachEvents = function () {
                assert.ok(true);
                done();
            };

            instance.destroy();
        }
    },

    "checkArguments": {
        "should allow missing config parameter": function () {
            assert.doesNotThrow(function () {
                var options = LessCluster.checkArguments();
                assert.ok("object" === typeof options);
            });
        },
        "should default options.directory to CWD": function () {
            var options = LessCluster.checkArguments({});

            assert.strictEqual(options.directory, process.cwd());
        },
        "should default options.outputdir to options.directory": function () {
            var options = LessCluster.checkArguments({});

            assert.strictEqual(options.outputdir, options.directory);
        }
    },

    "forkWorkers() should execute provided callback": function (done) {
        var instance = new LessCluster({
            workers: 0
        });

        instance.forkWorkers(function (err) {
            assert.ifError(err);
            instance.destroy();
            done();
        });
    },

    "run()": {
        "beforeEach": function (done) {
            this.instance = new LessCluster({
                // prevent workers from actually being spawned
                workers: 0
            });
            done();
        },
        "afterEach": function (done) {
            this.instance.destroy();
            this.instance = null;
            done();
        },

        "should call collect() without arguments": function (done) {
            this.instance.setupMaster = function () {};
            this.instance.collect = function () {
                assert.strictEqual(arguments.length, 0);
                done();
            };

            this.instance.run();
        },
        "should call setupMaster() with exec path": function (done) {
            this.instance.setupMaster = function (options) {
                assert.deepEqual(options, {
                    exec: path.resolve(__dirname, '../lib/less-worker.js')
                });
            };
            this.instance.collect = done;

            this.instance.run();
        },
        "_attachEvents() should fire after cluster.setupMaster()": function (done) {
            this.instance._attachEvents = function () {
                assert.ok(true);
                done();
            };

            this.instance.setupMaster();
        }
    },

    "collect()": {
        "beforeEach": function (done) {
            this.instance = new LessCluster();
            done();
        },
        "afterEach": function (done) {
            this.instance.destroy();
            this.instance = null;
            done();
        },

        "_getDestinationPath()": function () {
            assert.strictEqual(
                this.instance._getDestinationPath(__dirname + '/fixtures/file-reader/a.less'),
                __dirname + '/fixtures/file-reader/a.css'
            );
        },

        "_getRelativePath()": function () {
            assert.strictEqual(this.instance._getRelativePath(__dirname + '/fixtures'), 'test/fixtures');
        },
        "_getGlobPattern()": function () {
            assert.strictEqual(this.instance._getGlobPattern('foo'), 'foo/' + this.instance.options.match);
        },
        "_getLessExtension()": function () {
            assert.strictEqual(this.instance._getLessExtension('foo/bar.less'), 'foo/bar.less');
            assert.strictEqual(this.instance._getLessExtension('baz/qux'), 'baz/qux.less');
        },
        "_filterCSSImports()": function () {
            assert.strictEqual(this.instance._filterCSSImports('foo/bar.less'), true);
            assert.strictEqual(this.instance._filterCSSImports('baz/qux.css'), false);
        },
        "_parseImports()": function () {
            // console.error("TODO");
        },
        "_finishCollect()": function () {
            // console.error("TODO");
        },
        "collect()": function () {
            // console.error("TODO");
        }
    }
};
