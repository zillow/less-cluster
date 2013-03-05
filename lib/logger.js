/**
Logging mixin that respects options.
**/

// constructor only called from tests
var Logger = module.exports = function (config) {
    this.options = config || {};
};

// uses utils.mix to augment $KLASS.prototypes with Logger.prototype
Logger.prototype = {
    /**
    Emits debug messages to stdout when --verbose enabled.

    @method debug
    **/
    debug: function () {
        if (this.options.verbose) {
            console.log.apply(console, arguments);
        }
    },
    /**
    Emits log messages to stdout unless --quiet enabled.

    @method log
    **/
    log: function () {
        if (!this.options.quiet) {
            console.log.apply(console, arguments);
        }
    },
    /**
    Emits warning messages to stderr unless --quiet enabled.

    @method warn
    **/
    warn: function () {
        if (!this.options.quiet) {
            console.error.apply(console, arguments);
        }
    },
    /**
    Emits error messages to stderr unless --silent enabled.

    @method error
    **/
    error: function () {
        if (!this.options.silent) {
            console.error.apply(console, arguments);
        }
    }
};
