/**
less-cluster provides a wrapper around a less.Parser,
making it smarter about directories and parallel execution.
**/

var fs = require('graceful-fs');
var glob = require('glob');
var path = require('path');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var utils = require('./utils');
var readFiles = require('./read-files');
var Logger = require('./logger');

module.exports = LessCluster;

inherits(LessCluster, EventEmitter);
Logger.mixin(LessCluster);

/**
Make the LESS compiler faster with large batches.

@class LessCluster
@constructor
@extends EventEmitter
@mixin Logger
**/
function LessCluster(config) {
    // factory constructor
    if (!(this instanceof LessCluster)) {
        return new LessCluster(config);
    }

    // merge config with defaults, running guards
    var options = this.options = LessCluster.checkArguments(config);

    EventEmitter.call(this);
    Logger.call(this, options);

    // seed dependency graph(s)
    this._parents = {};
    this._children = {};
    this._fileData = {};
}

LessCluster.defaults = require('./cli').masterDefaults;

LessCluster.checkArguments = function (config) {
    var options = utils.merge(LessCluster.defaults, config);

    // default outputdir to directory
    if (!options.outputdir) {
        // options.directory always has a default
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
LessCluster.RX_IMPORT = /^\s*\@import\s+(?:\(less\)\s+)?["'](.+)['"](?:\s*[^;]*);/gm;

/**
Start the ball rolling.

@method run
@chainable
**/
LessCluster.prototype.run = function () {
    this.worker = require('./less-worker')(this.options);
    this._attachEvents();

    return this;
};

/**
Destroy worker and clean up event listeners.

@method destroy
**/
LessCluster.prototype.destroy = function () {
    this._detachEvents();
    this.worker.destroy();
};

/**
Attach listeners to lifecycle events.

@method _attachEvents
@private
**/
LessCluster.prototype._attachEvents = function () {
    this.worker.on("drain", this.onDrain.bind(this));
};

/**
Detach listeners from lifecycle events.

@method _detachEvents
@private
**/
LessCluster.prototype._detachEvents = function () {
    this.removeAllListeners();
};

/**
Get a filename off the stack.

@method getNextFile
@return {String|undefined} the next filename, or undefined if none remain
**/
LessCluster.prototype.getNextFile = function () {
    if (this.filesToProcess) {
        return this.filesToProcess.shift();
    }
};

/**
Listener for worker 'drain' event, which is emitted
when a worker finishes building a file.

If files remain to be processed, it is picked off the
stack and sent to the worker. Otherwise, emit 'finished'.

@method onDrain
@protected
**/
LessCluster.prototype.onDrain = function () {
    var fileName = this.getNextFile();
    if (fileName) {
        this.buildFile(fileName);
    } else {
        this.emit("finished");
    }
};

/**
Send a filename to be built.

@method buildFile
@param {String} fileName
**/
LessCluster.prototype.buildFile = function (fileName) {
    var worker = this.worker;
    if (worker && fileName) {
        worker.build({
            dest: this._getDestinationPath(fileName),
            file: fileName
        });
    }
};

LessCluster.prototype._getDestinationPath = function (file) {
    var cssPath = file.replace(this.options.directory, '').replace(/\.less$/, '.css');
    return path.join(this.options.outputdir, cssPath);
};

/**
Create pattern for glob

@method _getGlobPattern
@param {String} dir
@return {String}
@private
**/
LessCluster.prototype._getGlobPattern = function (dir) {
    return path.join(dir, this.options.match);
};

/**
Ensure file always has .less extension.

@method _getLessExtension
@param {String} file
@return {String} always with .less extension
@private
**/
LessCluster.prototype._getLessExtension = function (file) {
    return path.join(path.dirname(file), path.basename(file, '.less') + '.less');
};

/**
Removes *.css imports from filtered array.

@method _isNotCSS
@param {String} file
@return {Boolean} false if the file's extension is '.css'
@private
**/
LessCluster.prototype._isNotCSS = function (file) {
    return path.extname(file) !== '.css';
};

/**
Collect all the things!

When finished, it caches the contents of the collected files.

@method collect
@param {String} [dir]
@param {Function} [cb]
**/
LessCluster.prototype.collect = function (dir, cb) {
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
};

/**
For any ad-hoc files passed after directory and outputdir,
restrict the operations to those files (and their dependency
graph).

This augments the filesToProcess array derived from the
data passed to the _finishCollect method if additional consumers
are detected.

@method _filterAdHocFiles
@param {String[]} filesToProcess
@return {String[]} sorted array of file paths to read into cache
@private
**/
LessCluster.prototype._filterAdHocFiles = function (filesToProcess) {
    "use strict";

    var read = {},
        mix = utils.mix,
        parents = this._parents,
        children = this._children,

        visit = function (nodes, visitor, memo) {
            if (nodes) {
                Object.keys(nodes).forEach(visitor, memo);
            }
        },
        visitParents = function (node) {
            if (node in parents) {
                mix(this, parents[node]);
                visit(parents[node], visitParents, this);
            }
        },

        // copy array to allow modification in loop
        adHocFiles = filesToProcess.slice(),

        i = 0,
        file;

    for (; i < adHocFiles.length; i += 1) {
        file = adHocFiles[i];

        if (file in children) {
            // file is imported elsewhere
            mix(read, children[file]);

            // files that import this file need to be compiled as well
            filesToProcess.push.apply(filesToProcess, Object.keys(children[file]));

            visit(children[file], visitParents, read);
        }

        if (file in parents) {
            // file imports other files
            mix(read, parents[file]);

            visit(parents[file], visitParents, read);
        }

        // always read adHocFiles
        read[file] = true;
    }

    return Object.keys(read).sort();
};

/**
Callback for readFiles after glob's "end" event,
used by collect() when no other callback passed.

@method _finishCollect
@param {Error|null} err
@param {Object} data
@private
**/
LessCluster.prototype._finishCollect = function (err, data) {
    if (err) {
        throw err;
    }

    var filesToRead = Object.keys(data);
    var filesToProcess = this.options.files;

    // add data to cache
    utils.mix(this._fileData, data);

    // but only operate on added data, not entire cache
    filesToRead.forEach(this._parseImports, this);

    // individual files passed will filter the list
    if (filesToProcess) {
        filesToRead = this._filterAdHocFiles(filesToProcess);
    } else {
        // otherwise, process all files read
        filesToProcess = filesToRead;
    }

    // this.debug()
    // this.debug('filesToProcess (%d)', filesToProcess.length)
    // this.debug(filesToProcess)
    // this.debug()
    // this.debug('filesToRead (%d)', filesToRead.length)
    // this.debug(filesToRead)

    // this.startQueue(filesToProcess, filesToRead);
    this.emit("start", filesToProcess, filesToRead);

    // this.debug();
    // this.debug('Parents (files that import)');
    // this.debug(JSON.stringify(this._parents, null, 4));
    // this.debug();
    // this.debug('Children (files imported elsewhere)');
    // this.debug(JSON.stringify(this._children, null, 4));
    // this.debug();
};

/**
Iterator used to parse '@import' filenames from collected file data.

@method _parseImports
@param {String} fileName
@private
**/
LessCluster.prototype._parseImports = function (fileName) {
    var imports = [];
    var fileContents = this._fileData[fileName];
    var rx = LessCluster.RX_IMPORT;

    // this.debug(fileName);

    // avoid non-importing files
    if (rx.test(fileContents)) {
        // reset from test() to avoid losing first match
        rx.lastIndex = 0;

        // cheap way to unique array later
        imports = {};

        // prepare inner loop
        var idx,
            importedPath,
            resolvedPath,
            envPaths = [path.dirname(fileName)].concat(this.options.paths);

        // loop through captures
        var captured = rx.exec(fileContents);
        while (captured) {
            importedPath = null;

            if (this._isNotCSS(captured[1])) {
                for (idx = 0; idx < envPaths.length; idx += 1) {
                    resolvedPath = this._getLessExtension(path.resolve(envPaths[idx], captured[1]));
                    if (fs.existsSync(resolvedPath)) {
                        importedPath = resolvedPath;
                        break;
                    }
                }
            }

            if (importedPath) {
                imports[importedPath] = true;
            }

            captured = rx.exec(fileContents);
        }

        // clean up raw hash into sorted unique array
        imports = Object.keys(imports).sort();
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

        // this.debug(JSON.stringify(imports, null, 4));
    }
};
