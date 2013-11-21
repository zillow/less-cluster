/**
Inspired by https://github.com/pvorb/node-read-files
**/

var fs = require('graceful-fs');

module.exports = readFiles;

/**
Asynchronously read a bunch of files without causing EMFILE errors.

@method readFiles
@param {Array} files
@param {Object} [options]
    @param {String} [options.encoding='utf8']
    @param {Number} [options.batchCount=100]
@param {Function} callback
    @param {Error|null} err
    @param {Object} data    All file contents, keyed by filename
**/
function readFiles(files, options, callback) {
    if ("function" === typeof options) {
        callback = options;
        options = {};
    }

    var rf = new readFiles.FileReader(files, options, callback);
    rf.next();
    return rf;
}

readFiles.FileReader = FileReader;

/**
Mostly to aid testing, though I guess you could use it directly if you want.

@class FileReader
@constructor
**/
function FileReader(files, options, callback) {
    if (!(this instanceof FileReader)) {
        return new FileReader(files, options, callback);
    }

    if (!files || !Array.isArray(files)) {
        throw "Must pass an array of files to read.";
    }

    options = options || {};

    this.data = {};
    this.files = files;
    this.encoding = options.encoding || 'utf8';
    this.batchCount = options.batchCount || 100;
    this.callback = callback || FileReader.noop;
}

FileReader.noop = function () {};

FileReader.prototype = {
    next: function () {
        var self = this,
            nextBatch = self.files.splice(0, self.batchCount),
            remaining = nextBatch.length;

        if (!remaining) {
            self.callback(null, self.data);
            return;
        }

        nextBatch.forEach(function (file) {
            fs.readFile(file, self.encoding, function (err, contents) {
                if (!err) {
                    self.data[file] = contents;
                    if (--remaining === 0) {
                        self.next();
                    }
                } else {
                    self.callback(err);
                }
            });
        });
    }
};
