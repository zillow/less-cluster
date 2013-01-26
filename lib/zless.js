/**
zless provides a wrapper around a less.Parser,
making it smarter about directories and parallel execution.
**/

var merge = require('./utils').merge;

/**
Make the LESS compiler faster with large batches.

@class ZLess
@constructor
**/
var ZLess = module.exports = function (config) {
    // factory constructor
    if (!(this instanceof ZLess)) {
        return new ZLess(config);
    }

    // merge config with defaults
    var opts = this.options = merge(ZLess.defaults, config);

    if (opts.cli) {
        this.run();
    }
};

ZLess.defaults = {
    workers: require('os').cpus().length
};

ZLess.prototype = {
    run: function () {}
};
