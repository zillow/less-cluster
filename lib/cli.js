/**
Argument parsing for class and cli
**/

var nopt = require('nopt');
var path = require('path');

var knownOpts = {
    'directory': path,
    'outputdir': path,
    'help': Boolean,
    'version': Boolean
};
var shortHands = {
    'd': ['--directory'],
    'o': ['--outputdir'],
    'h': ['--help'],
    'v': ['--version']
};

var cli = module.exports = {
    knownOpts: knownOpts,
    shortHands: shortHands,
    parse: function (argv, slice) {
        // console.log(argv);
        return nopt(knownOpts, shortHands, argv, slice);
    },
    _getUsage: function () {
        return [
            'less-cluster v' + cli._getVersion(),
            '',
            '    -d, --directory Directory to search for LESS source files',
            '    -o, --outputdir Directory to output generated CSS files into',
            '    -h, --help      Show this help',
            '    -v, --version   Display the version',
            ''
        ].join('\n');
    },
    _getVersion: function () {
        return require('../package.json').version;
    },
    usage: function () {
        console.log(cli._getUsage());
    },
    version: function () {
        console.log(cli._getVersion());
    }
};
