/**
less-cluster provides a wrapper around a less.Parser,
making it smarter about directories and parallel execution.
**/

var merge = require('./utils').merge;

/**
Make the LESS compiler faster with large batches.

@class LessCluster
@constructor
**/
var LessCluster = module.exports = function (config) {
    // factory constructor
    if (!(this instanceof LessCluster)) {
        return new LessCluster(config);
    }

    // merge config with defaults
    var opts = this.options = merge(LessCluster.defaults, config);

    if (opts.cli) {
        this.run();
    }
};

LessCluster.defaults = {
    workers: require('os').cpus().length
};

LessCluster.prototype = {
    run: function () {}
};
