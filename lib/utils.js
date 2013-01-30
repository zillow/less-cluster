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

/**
Split an array into _n_ equal(ish) chunks.
http://stackoverflow.com/a/8189268

@method splitArray
@param {Array} arr
@param {Number} n
@return {Array[]} an array of _n_ elements with the partitioned members
**/
exports.splitArray = function (arr, n) {
    var out = [],
        len = arr.length,
        i = 0,
        size;

    while (i < len) {
        size = Math.ceil((len - i) / n--);
        out.push(arr.slice(i, i += size));
    }

    return out;
};
