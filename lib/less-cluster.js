/**
less-cluster provides a wrapper around a less.Parser,
making it smarter about directories and parallel execution.
**/

var glob = require('glob');
var path = require('path');

var utils = require('./utils');
var readFiles = require('./read-files');

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

    // merge config with defaults, running guards
    var opts = utils.merge(LessCluster.defaults, config);
    this.options = LessCluster.checkArguments(opts);

    if (opts.cli) {
        this.run();
    }
};

LessCluster.defaults = {
    match: '**/*.less',
    workers: require('os').cpus().length
};

LessCluster.checkArguments = function (options) {
    // default directory to cwd
    if (!options.directory) {
        options.directory = '.';
    }

    // default outputdir to directory
    if (!options.outputdir && options.directory) {
        options.outputdir = options.directory;
    }

    return options;
};

LessCluster.prototype = {
    /**
    Start the ball rolling.

    @method run
    **/
    run: function () {
        if (this.options.directory) {
            this.collect();
        }
    },

    /**
    Convert absolute dirpath into relative fragment

    @method _getRelativePath
    @param {String} dir
    @return {String}
    @private
    **/
    _getRelativePath: function (dir) {
        return path.relative(process.cwd(), dir);
    },

    /**
    Create pattern for glob

    @method _getGlobPattern
    @param {String} dir
    @return {String}
    @private
    **/
    _getGlobPattern: function (dir) {
        return path.join(this._getRelativePath(dir), this.options.match);
    },

    /**
    Collect all the things!

    When finished, it caches the contents of the collected files.

    @method collect
    @param {String} [dir]
    @param {Function} [cb]
    **/
    collect: function (dir, cb) {
        var self = this;

        if ("string" !== typeof dir) {
            cb = dir;
            dir = self.options.directory;
        }
        if ("function" !== typeof cb) {
            cb = self._collected.bind(self);
        }

        var fileList = glob(self._getGlobPattern(dir));

        fileList.on('error', function (err) {
            fileList.abort();
            throw err;
        });

        fileList.on('end', function (matches) {
            self.cacheFileData(matches, cb);
        });
    },

    /**
    Callback for collect() glob's "end" event.

    @method cacheFileData
    @param {String[]} matches
    @param {Function} [cb]
    @protected
    **/
    cacheFileData: function (matches, cb) {
        readFiles(matches, cb);
    },

    /**
    Callback for cacheFileData, passed from collect() by default.

    @method _collected
    @param {Error|null} err
    @param {Object} data
    @private
    **/
    _collected: function (err, data) {
        if (err) {
            throw err;
        }

        this._fileData = data;

        var fileNames = Object.keys(data);
        fileNames.forEach(this._parseImports, this);
    },

    /**
    Iterator used to parse '@import' filenames from collected file data.

    @method _parseImports
    @param {String} fileName
    @private
    **/
    _parseImports: function (fileName) {
        // var imports = [];
        // TODO
    }
};
