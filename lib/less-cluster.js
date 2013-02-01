/**
less-cluster provides a wrapper around a less.Parser,
making it smarter about directories and parallel execution.
**/

var glob = require('glob');
var path = require('path');
var cluster = require('cluster');

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
    var opts = this.options = LessCluster.checkArguments(config);

    // seed dependency graph(s)
    this._parents = {};
    this._children = {};
    this._fileData = {};

    if (opts.cli) {
        this.run();
    }
};

LessCluster.defaults = {
    match: '**/*.less',
    workers: require('os').cpus().length
};

LessCluster.checkArguments = function (config) {
    var options = utils.merge(LessCluster.defaults, config);

    // default directory to cwd
    if (!options.directory) {
        options.directory = process.cwd();
    }

    // default outputdir to directory
    if (!options.outputdir && options.directory) {
        options.outputdir = options.directory;
    }

    return options;
};

/**
Regular expression that is used to extract imports from a LESS file.

@property RX_IMPORT
@type {RegExp}
@static
**/
LessCluster.RX_IMPORT = /\@import\s+["'](.+)['"];/g;

LessCluster.prototype = {
    /**
    Start the ball rolling.

    @method run
    **/
    run: function () {
        if (cluster.isMaster) {
            this.setupMaster({
                exec: __dirname + '/less-worker.js'
            });
            this.forkWorkers(this.collect.bind(this));
        }
    },

    /**
    Pass options to cluster.setupMaster().

    @method setupMaster
    @param {Object} options
    @protected
    **/
    setupMaster: function (options) {
        cluster.setupMaster(options);
    },

    /**
    Fork and setup event listeners for all workers.

    @method forkWorkers
    @param {Function} [cb]
    @protected
    **/
    forkWorkers: function (cb) {
        var i = 0, numWorkers = this.options.workers, worker, online = 0;
        for (; i < numWorkers; i += 1) {
            worker = cluster.fork();
        }

        if (cb) {
            cb(null);
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
    Ensure file always has .less extension.

    @method _getLessExtension
    @param {String} file
    @return {String} always with .less extension
    @private
    **/
    _getLessExtension: function (file) {
        return path.join(path.dirname(file), path.basename(file, '.less') + '.less');
    },

    /**
    Removes *.css imports from filtered array.

    @method _filterCSSImports
    @param {String} file
    @return {Boolean} false if the file's extension is '.css'
    @private
    **/
    _filterCSSImports: function (file) {
        return path.extname(file) !== '.css';
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
            cb = self._finishCollect.bind(self);
        }

        var fileList = glob(self._getGlobPattern(dir));

        fileList.on('error', function (err) {
            fileList.abort();
            throw err;
        });

        fileList.on('end', function (matches) {
            readFiles(matches, cb);
        });
    },

    /**
    Callback for readFiles after glob's "end" event,
    used by collect() when no other callback passed.

    @method _finishCollect
    @param {Error|null} err
    @param {Object} data
    @private
    **/
    _finishCollect: function (err, data) {
        if (err) {
            throw err;
        }

        // add data to cache
        utils.mix(this._fileData, data);

        // but only operate on added data, not entire cache
        Object.keys(data).forEach(this._parseImports, this);

        // console.log();
        // console.log('Parents (files that import)');
        // console.log(JSON.stringify(this._parents, null, 4));
        // console.log();
        // console.log('Children (files imported elsewhere)');
        // console.log(JSON.stringify(this._children, null, 4));
        // console.log();
    },

    /**
    Iterator used to parse '@import' filenames from collected file data.

    @method _parseImports
    @param {String} fileName
    @private
    **/
    _parseImports: function (fileName) {
        var imports = [];
        var fileContents = this._fileData[fileName];
        var rx = LessCluster.RX_IMPORT;

        // console.log(fileName);

        // avoid non-importing files
        if (rx.test(fileContents)) {
            // reset from test() to avoid losing first match
            rx.lastIndex = 0;

            // cheap way to unique array later
            imports = {};

            // cache dirname to avoid calling every iteration
            var dirName = path.dirname(fileName);

            // loop through captures
            var captured = rx.exec(fileContents);
            while (captured) {
                imports[path.resolve(dirName, captured[1])] = true;
                captured = rx.exec(fileContents);
            }

            // clean up raw hash into sorted unique array
            imports = Object.keys(imports)
                .sort()
                .filter(this._filterCSSImports)
                .map(this._getRelativePath)
                .map(this._getLessExtension);
        }

        if (imports.length) {
            // always blows away parent record, even for partial runs
            this._parents[fileName] = {};

            var len = imports.length, child, i = 0;
            for (; i < len; i += 1) {
                child = imports[i];

                this._parents[fileName][child] = true;

                if (!this._children.hasOwnProperty(child)) {
                    this._children[child] = {};
                }
                this._children[child][fileName] = true;
            }

            // console.log(JSON.stringify(imports, null, 4));
        }
    }
};
