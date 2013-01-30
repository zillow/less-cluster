/**
Tests for the main class
**/
var LessCluster = require('../lib/less-cluster');

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
        }
    },
/*
    "master": {
        "config": function (test) {
            test.fail('TODO');
            test.done();
        },
        "spawns": function (test) {
            test.fail('TODO');
            test.done();
        }
    },

    "worker": {
        "config": function (test) {
            test.fail('TODO');
            test.done();
        },
        "executes": function (test) {
            test.fail('TODO');
            test.done();
        }
    },
*/
    "methods": {
        "run": function (test) {
            test.expect(1);

            var instance = new LessCluster();

            instance.collect = function () {
                test.strictEqual(instance.options.directory, '.');
                test.done();
            };

            // this will end the test
            instance.run();
        },
        "_getRelativePath": function (test) {
            var instance = new LessCluster();

            test.strictEqual(instance._getRelativePath(__dirname + '/fixtures'), 'test/fixtures');

            test.done();
        },
        "_getGlobPattern": function (test) {
            var instance = new LessCluster();

            test.strictEqual(instance._getGlobPattern('foo'), 'foo/' + instance.options.match);

            test.done();
        },
        "collect": function (test) {
            console.error("TODO");
            test.done();
        }
    }
};
