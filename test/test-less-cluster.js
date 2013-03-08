/**
Tests for the main class
**/
var assert = require('assert');
var vows = require('vows');
var path = require('path');

var EventEmitter = require('events').EventEmitter;
var LessCluster = require('../lib/less-cluster');

var suite = vows.describe('Master');

suite.addBatch({
    "static defaults": {
        topic: function () {
            return LessCluster.defaults;
        },
        "should be an object": function (topic) {
            assert.isObject(topic);
        },
        "should have 'directory' default": function (topic) {
            assert.include(topic, 'directory');
        },
        "should have 'match' default": function (topic) {
            assert.include(topic, 'match');
        },
        "should have 'workers' default": function (topic) {
            assert.include(topic, 'workers');
        }
    }
});

suite.addBatch({
    "factory": {
        topic: function () {
            /*jshint newcap: false */
            return LessCluster();
        },
        "should instantiate without 'new'": function (topic) {
            assert.ok(topic instanceof LessCluster);
        }
    },
    "instance": {
        topic: function () {
            return new LessCluster();
        },
        "should instantiate safely with no config": function (topic) {
            assert.ok(topic instanceof LessCluster);
        },
        "should inherit EventEmitter": function (topic) {
            assert.ok(LessCluster.super_ === EventEmitter);
            assert.ok(topic instanceof EventEmitter);
        },
        "should default all options": function (topic) {
            assert.ok(topic.hasOwnProperty('options'));

            assert.strictEqual(topic.options.match, '**/*.less');
            assert.strictEqual(topic.options.workers, require('os').cpus().length);
        },
        "should setup private caches": function (topic) {
            assert.ok(topic.hasOwnProperty('_parents'));
            assert.ok(topic.hasOwnProperty('_children'));
            assert.ok(topic.hasOwnProperty('_fileData'));

            assert.deepEqual(topic._parents, {});
            assert.deepEqual(topic._children, {});
            assert.deepEqual(topic._fileData, {});
        },
        "destroy()": {
            topic: function () {
                var instance = new LessCluster();

                instance._detachEvents = function () {
                    this.callback(true);
                };

                instance.destroy();
            },
            "should call _detachEvents": function (topic) {
                assert.ok(topic);
            }
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
    }
});

suite.addBatch({
    "forkWorkers()": {
        topic: function () {
            var instance = new LessCluster({
                workers: 0
            });

            instance.forkWorkers(this.callback);
        },
        "should execute provided callback": function (err) {
            assert.ifError(err);
        }
    }
});

suite.addBatch({
    "run()": {
        "should call collect() without arguments": function () {
            var instance = new LessCluster({ workers: 0 });

            instance.setupMaster = function () {};
            instance.collect = function () {
                assert.strictEqual(arguments.length, 0);
            };

            instance.run();
        },
        "should call setupMaster() with exec path": function () {
            var instance = new LessCluster({ workers: 0 });

            instance.setupMaster = function (options) {
                assert.deepEqual(options, {
                    exec: path.resolve(__dirname, '../lib/less-worker.js')
                });
            };
            instance.collect = function () {};

            instance.run();
        },
        "_attachEvents() should fire after cluster.setupMaster()": function () {
            var instance = new LessCluster({ workers: 0 });

            instance._attachEvents = function () {
                assert.ok(true);
            };

            instance.setupMaster();
        }
    }
});

var importsDir = __dirname + '/fixtures/imports/';

suite.addBatch({
    "collect()": {
        topic: new LessCluster({
            "directory": importsDir
        }),

        "_getDestinationPath()": function (topic) {
            assert.strictEqual(
                topic._getDestinationPath(importsDir + 'base.less'),
                importsDir + 'base.css'
            );
        },

        "_getRelativePath()": function (topic) {
            assert.strictEqual(topic._getRelativePath(__dirname + '/fixtures'), 'test/fixtures');
        },
        "_getGlobPattern()": function (topic) {
            assert.strictEqual(topic._getGlobPattern('foo'), 'foo/' + topic.options.match);
        },
        "_getLessExtension()": function (topic) {
            assert.strictEqual(topic._getLessExtension('foo/bar.less'), 'foo/bar.less');
            assert.strictEqual(topic._getLessExtension('baz/qux'), 'baz/qux.less');
        },
        "_filterCSSImports()": function (topic) {
            assert.strictEqual(topic._filterCSSImports('foo/bar.less'), true);
            assert.strictEqual(topic._filterCSSImports('baz/qux.css'), false);
        },
        "_parseImports()": function () {
            // console.error("TODO");
        },
        "_finishCollect()": function () {
            // console.error("TODO");
        },
        "when executed": {
            topic: function (instance) {
                instance.collect(this.callback);
            },
            "does not error": function (err, data) {
                assert.ifError(err);
            },
            "provides data object": function (err, data) {
                assert.isObject(data);
            },
            "finds all files successfully": function (err, data) {
                assert.equal(Object.keys(data).length, 7);

                assert.include(data, importsDir + "_variables.less");
                assert.include(data, importsDir + "base.less");
                assert.include(data, importsDir + "modules/child.less");
                assert.include(data, importsDir + "modules/parent.less");
                assert.include(data, importsDir + "modules/solo.less");
                assert.include(data, importsDir + "themes/fancy.less");
                assert.include(data, importsDir + "themes/simple.less");
            }
        }
    }
});

function filterInstance(relativePaths) {
    return function () {
        return new LessCluster({
            "directory": importsDir,
            "_files": relativePaths.map(function (p) {
                return path.join(importsDir, p);
            })
        });
    };
}

function filesProcessed(instance) {
    var test = this;

    instance.startQueue = function (filesToProcess) {
        // context provides access to this._parents/_children in vows
        test.callback.call(instance, null, filesToProcess);
    };

    instance.collect();
}

suite.addBatch({
    "_files filter": {
        "(themes/simple)": {
            topic: filterInstance(["themes/simple.less"]),
            "filesToProcess": {
                topic: filesProcessed,
                "has three items": function (topic) {
                    // console.error("parents =", JSON.stringify(this._parents, null, 4));
                    // console.error("chillun =", JSON.stringify(this._children, null, 4));
                    assert.equal(topic.length, 3);
                },
                "_variables": function (topic) {
                    assert.strictEqual(topic[0], importsDir + "_variables.less");
                },
                "modules/child": function (topic) {
                    assert.strictEqual(topic[1], importsDir + "modules/child.less");
                },
                "themes/simple": function (topic) {
                    assert.strictEqual(topic[2], importsDir + "themes/simple.less");
                }
            }
        },
        "(modules/solo)": {
            topic: filterInstance(["modules/solo.less"]),
            "filesToProcess": {
                topic: filesProcessed,
                "has one item": function (topic) {
                    assert.equal(topic.length, 1);
                },
                "modules/solo": function (topic) {
                    assert.strictEqual(topic[0], importsDir + "modules/solo.less");
                }
            }
        }
    }
});

suite["export"](module);
