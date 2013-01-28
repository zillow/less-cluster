/**
Argument parsing for class and cli
**/

var nopt = require('nopt');

var knownOpts = {
    'help': Boolean,
    'version': Boolean
};
var shortHands = {
    'h': ['--help'],
    'v': ['--version']
};

var cli = module.exports = {
    knownOpts: knownOpts,
    shortHands: shortHands,
    parse: function (argv) {
        // console.log(argv);
        return nopt(knownOpts, shortHands, argv);
    },
    _getUsage: function () {
        return [
            'less-cluster v' + cli._getVersion(),
            '',
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
