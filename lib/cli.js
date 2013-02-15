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
    defaults: {
        // specific to this tool
        directory       : process.cwd(),
        match           : '**/*.less',
        ignores         : ['**/_*.less'],
        workers         : require('os').cpus().length,

        // passed through to less
        paths           : [],
        optimization    : 1,
        rootpath        : '',
        relativeUrls    : false,
        color           : true,
        compress        : false,
        yuicompress     : false,
        dumpLineNumbers : false,
        lint            : false,
        strictImports   : false,
        strictMaths     : true,
        strictUnits     : true,
        silent          : false,
        verbose         : false
    },
    parse: function (argv, slice) {
        // console.log(argv);
        var parsed = nopt(knownOpts, shortHands, argv, slice),
            remain = parsed.argv.remain;

        // treat single remaining arg as directory if not passed via option
        if (!parsed.directory && remain.length === 1 && remain[0].length) {
            parsed.directory = path.resolve(remain[0]);
        }

        return parsed;
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
