/**
Tests for the main class
**/
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
            test.done();
        });
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
        }
    },

    "collect()": {
        "setUp": function (done) {
            this.instance = new LessCluster();
            done();
        },
        "tearDown": function (done) {
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
