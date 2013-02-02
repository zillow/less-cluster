/**
Tests for the main class
**/
var EventEmitter = require('events').EventEmitter;
var LessCluster = require('../lib/less-cluster');
var path = require('path');

module.exports = {
    "lifecycle": {
        "should instantiate safely with no config": function (test) {
            var instance = new LessCluster();
            test.ok(instance instanceof LessCluster);
            test.done();
        },
        "factory should instantiate without 'new'": function (test) {
            /*jshint newcap: false */
            var instance = LessCluster();
            test.ok(instance instanceof LessCluster);
            test.done();
        },
        "should inherit EventEmitter": function (test) {
            var instance = new LessCluster();

            test.ok(LessCluster.super_ === EventEmitter);
            test.ok(instance instanceof EventEmitter);

            instance.on('foo', function (bar) {
                test.strictEqual(bar, 'bar');
                test.done();
            });
            instance.emit('foo', 'bar');
        },
        "should possess static default options": function (test) {
            var options = LessCluster.defaults;
            test.ok(!!options);

            test.ok(options.hasOwnProperty('match'));
            test.ok(options.hasOwnProperty('workers'));

            test.strictEqual(options.match, '**/*.less');
            test.strictEqual(options.workers, require('os').cpus().length);

            test.done();
        },
        "should default all instance options": function (test) {
            var instance = new LessCluster();
            test.ok(instance.hasOwnProperty('options'));

            test.strictEqual(instance.options.match, '**/*.less');
            test.strictEqual(instance.options.workers, require('os').cpus().length);

            test.done();
        },
        "instance should setup private caches": function (test) {
            var instance = new LessCluster();

            test.ok(instance.hasOwnProperty('_parents'));
            test.ok(instance.hasOwnProperty('_children'));
            test.ok(instance.hasOwnProperty('_fileData'));

            test.deepEqual(instance._parents, {});
            test.deepEqual(instance._children, {});
            test.deepEqual(instance._fileData, {});

            test.done();
        },
        "destroy() should call _detachEvents": function (test) {
            var instance = new LessCluster();

            instance._detachEvents = function () {
                test.ok(true);
                test.done();
            };

            instance.destroy();
        },
        "destroy() should call _resetPool": function (test) {
            var instance = new LessCluster();

            instance._resetPool = function () {
                test.ok(true);
                test.done();
            };

            instance.destroy();
        }
    },

    "checkArguments": {
        "should allow missing config parameter": function (test) {
            test.expect(2);

            test.doesNotThrow(function () {
                var options = LessCluster.checkArguments();
                test.ok("object" === typeof options);
            });

            test.done();
        },
        "should default options.directory to CWD": function (test) {
            var options = LessCluster.checkArguments({});

            test.strictEqual(options.directory, process.cwd());

            test.done();
        },
        "should default options.outputdir to options.directory": function (test) {
            var options = LessCluster.checkArguments({});

            test.strictEqual(options.outputdir, options.directory);

            test.done();
        }
    },

    "forkWorkers() should execute provided callback": function (test) {
        test.expect(1);

        var instance = new LessCluster({
            workers: 0
        });

        instance.forkWorkers(function (err) {
            test.ifError(err);
            instance.destroy();
            test.done();
        });
    },

    "pool": {
        "setUp": function (done) {
            this.instance = new LessCluster();
            done();
        },
        "tearDown": function (done) {
            this.instance.destroy();
            this.instance = null;
            done();
        },

        "should start with an empty pool": function (test) {
            test.ok(this.instance.hasOwnProperty('_pool'));
            test.ok(Array.isArray(this.instance._pool));
            test.ok(this.instance._pool.length === 0);

            test.done();
        },
        "should add to pool": function (test) {
            this.instance._poolAdd(1);

            test.strictEqual(this.instance._pool.length, 1);
            test.strictEqual(this.instance._pool[0], 1);

            test.done();
        },
        "should retrieve next member of pool": function (test) {
            this.instance._poolAdd(1);

            test.strictEqual(this.instance._poolNext(), 1);

            test.done();
        },
        "should return undefined when no members in pool": function (test) {
            test.strictEqual(this.instance._poolNext(), undefined);

            test.done();
        },
        "should remove member from pool": function (test) {
            this.instance._poolAdd(1);
            this.instance._poolAdd(2);

            this.instance._poolRemove(1);

            test.strictEqual(this.instance._pool.length, 1);
            test.strictEqual(this.instance._pool[0], 2);

            test.done();
        },
        "should reset pool": function (test) {
            this.instance._poolAdd(1);
            this.instance._poolAdd(2);
            this.instance._poolAdd(3);

            test.strictEqual(this.instance._pool.length, 3);

            this.instance._resetPool();

            test.strictEqual(this.instance._pool.length, 0);

            test.done();
        }
    },

    "run()": {
        "setUp": function (done) {
            this.instance = new LessCluster({
                // prevent workers from actually being spawned
                workers: 0
            });
            done();
        },
        "tearDown": function (done) {
            this.instance.destroy();
            this.instance = null;
            done();
        },

        "should call collect() without arguments": function (test) {
            test.expect(1);

            this.instance.setupMaster = function () {};
            this.instance.collect = function () {
                test.strictEqual(arguments.length, 0);
                test.done();
            };

            this.instance.run();
        },
        "should call setupMaster() with exec path": function (test) {
            test.expect(1);

            this.instance.setupMaster = function (options) {
                test.deepEqual(options, {
                    exec: path.resolve(__dirname, '../lib/less-worker.js')
                });
            };
            this.instance.collect = test.done;

            this.instance.run();
        },
        "_attachEvents() should fire after cluster.setupMaster()": function (test) {
            this.instance._attachEvents = function () {
                test.ok(true);
                test.done();
            };

            this.instance.setupMaster();
        }
    },

    "collect()": {
        "setUp": function (done) {
            this.instance = new LessCluster();
            done();
        },
        "tearDown": function (done) {
            this.instance.destroy();
            this.instance = null;
            done();
        },

        "_getRelativePath()": function (test) {
            test.strictEqual(this.instance._getRelativePath(__dirname + '/fixtures'), 'test/fixtures');

            test.done();
        },
        "_getGlobPattern()": function (test) {
            test.strictEqual(this.instance._getGlobPattern('foo'), 'foo/' + this.instance.options.match);

            test.done();
        },
        "_getLessExtension()": function (test) {
            test.strictEqual(this.instance._getLessExtension('foo/bar.less'), 'foo/bar.less');
            test.strictEqual(this.instance._getLessExtension('baz/qux'), 'baz/qux.less');

            test.done();
        },
        "_filterCSSImports()": function (test) {
            test.strictEqual(this.instance._filterCSSImports('foo/bar.less'), true);
            test.strictEqual(this.instance._filterCSSImports('baz/qux.css'), false);

            test.done();
        },
        "_parseImports()": function (test) {
            console.error("TODO");

            test.done();
        },
        "_finishCollect()": function (test) {
            console.error("TODO");

            test.done();
        },
        "collect()": function (test) {
            console.error("TODO");

            test.done();
        }
    }
};
