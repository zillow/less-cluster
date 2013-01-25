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

module.exports = {
    knownOpts: knownOpts,
    shortHands: shortHands,
    parse: function (argv) {
        return nopt(knownOpts, shortHands, argv);
    },
    usage: function () {
        console.log([
            'zless',
            '',
            '    -h, --help      Show this help',
            '    -v, --version   Display the version',
            ''
        ].join('\n'));
    }
};
