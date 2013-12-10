/**
Utilities
**/

// mix & merge lifted from yui-base, simplified
var mix = exports.mix = function (receiver, supplier) {
    if (!receiver || !supplier) {
        return receiver || {};
    }

    Object.keys(supplier).forEach(function (key) {
        receiver[key] = supplier[key];
    });

    return receiver;
};

exports.merge = function () {
    var args   = arguments,
        i      = 0,
        len    = args.length,
        result = {};

    for (; i < len; i += 1) {
        mix(result, args[i]);
    }

    return result;
};

// lifted verbatim from lodash
exports.compact = function (array) {
    var index = -1,
        length = array ? array.length : 0,
        resIndex = 0,
        result = [];

    while (++index < length) {
        var value = array[index];
        if (value) {
            result[resIndex++] = value;
        }
    }
    return result;
};
