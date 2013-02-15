/**
Argument parsing for class and cli
**/

var nopt = require('nopt');
var path = require('path');

var knownOpts = {
    // specific to this tool
    'directory' : path,
    'outputdir' : path,
    'match'     : String,
    'ignores'   : [String, Array],
    'workers'   : Number,

    // passed through to less (non-dashed env properties)
    'paths'         : [path, Array],
    'optimization'  : [0, 1, 2],
    'rootpath'      : String,
    'relativeUrls'  : Boolean,
    'color'         : Boolean,
    'compress'      : Boolean,
    'yuicompress'   : Boolean,
    'dumpLineNumbers': ['comments', 'mediaquery', 'all'],
    'lint'          : Boolean,
    'strictImports' : Boolean,
    'strictMaths'   : Boolean,
    'strictUnits'   : Boolean,
    'silent'        : Boolean,
    'verbose'       : Boolean,

    // general cli
    'help'      : Boolean,
    'version'   : Boolean
};
var shortHands = {
    // specific to this tool
    'd': ['--directory'],
    'o': ['--outputdir'],
    'm': ['--match'],
    'i': ['--ignores'],
    'w': ['--workers'],

    // passed through to less
    'I': ['--include-path'],
    'O': ['--optimization'],
    'rp':['--rootpath'],
    'ru':['--relative-urls'],
    // no shorthand --color
    'x': ['--compress'],
    // no shorthand --yui-compress
    // no shorthand --line-numbers
    'l': ['--lint'],
    // no shorthand --strict-imports
    'sm':['--strict-maths'],
    'su':['--strict-units'],
    's': ['--silent'],
    'V': ['--verbose'],

    // translate dashed flags to camelCase options
    'include-path'  : ['--paths'],
    'relative-urls' : ['--relativeUrls'],
    'yui-compress'  : ['--yuicompress'],
    'line-numbers'  : ['--dumpLineNumbers'],
    'strict-imports': ['--strictImports'],
    'strict-maths'  : ['--strictMaths'],
    'strict-units'  : ['--strictUnits'],

    // Avoids most 1.4.x back-compat issues
    'legacy': ['--no-strictMaths', '--no-strictUnits'],

    // general cli
    'h': ['--help'],
    'v': ['--version']
};

var cli = module.exports = {
    knownOpts: knownOpts,
    shortHands: shortHands,
    masterDefaults: {
        // specific to this tool
        directory       : process.cwd(),
        match           : '**/*.less',
        ignores         : ['**/_*.less'],
        workers         : require('os').cpus().length
    },
    workerDefaults: {
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

        // if single include-path provided, assume it's the old syntax
        if (parsed.paths && parsed.paths.length === 1 && parsed.paths[0].length) {
            parsed.paths = parsed.paths[0].split(process.platform === 'win32' ? ';' : ':');
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
