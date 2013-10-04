/**
Logging mixin that uses options to determine level.

Add it to a class via the static mixin(klass) method.

    var inherits = require('util').inherits;
    var ParentClass = require('parent-class');
    var Logger = require('logger');

    module.exports = ChildClass;

    inherits(ChildClass, ParentClass)
    Logger.mixin(ChildClass);

    function ChildClass(options) {
        ParentClass.call(this, options);
        Logger.call(this, options);
        // et cetera
    }


Be sure to call Logger constructor *after* parent constructor in mixed classes.
**/
var mix = require('./utils').mix;

module.exports = Logger;

function Logger(options) {
    options = options || {};

    if (options.verbose) {
        this.debug = _log;
    }

    if (!options.quiet) {
        this.log = _log;
        this.warn = _err;
    }

    if (!options.silent) {
        this.error = _err;
    }
}

// establish no-op API, conditionally overridden in constructor
Logger.mixin = function (ctor) {
    mix(ctor.prototype, Logger.prototype);
};

/**
Emits debug messages to stdout when --verbose enabled.

@method debug
**/
Logger.prototype.debug = noop;

/**
Emits log messages to stdout unless --quiet enabled.

@method log
**/
Logger.prototype.log = noop;

/**
Emits warning messages to stderr unless --quiet enabled.

@method warn
**/
Logger.prototype.warn = noop;

/**
Emits error messages to stderr unless --silent enabled.

@method error
**/
Logger.prototype.error = noop;

function noop() {
    // noop
}

function _log() {
    console.log.apply(console, arguments);
}

function _err() {
    console.error.apply(console, arguments);
}
