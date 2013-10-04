/**
Avoid invoking cluster stuff when using programmatically.
**/

exports = module.exports = require("./lib/less-cluster");

// make it available dynamically if they really, really want it.
["master", "worker"].forEach(function (name) {
    Object.defineProperty(exports, name, {
        get: function () {
            return require("./lib/less-" + name);
        }
    });
});
