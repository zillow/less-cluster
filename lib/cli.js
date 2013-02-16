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
    'I': ['--paths'],
    'O': ['--optimization'],
    'rp':['--rootpath'],
    'ru':['--relativeUrls'],
    // no shorthand --color
    'x': ['--compress'],
    // no shorthand --yuicompress
    // no shorthand --dumpLineNumbers
    'l': ['--lint'],
    // no shorthand --strictImports
    // 'sm':['--strictMaths'],
    // 'su':['--strictUnits'],
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

// Cap workers to 8 maximum, unless overridden by CLI option,
// which avoids spawning too many processes on beefy boxen.
var MAX_WORKERS = 8;

// Back-compat for -I option, which may resemble a PATH value
// ("foo/bar:baz/qux") if passed only one value.
var PATH_DELIM = (process.platform === 'win32' ? ';' : ':');

var cli = module.exports = {
    MAX_WORKERS: MAX_WORKERS,
    PATH_DELIM: PATH_DELIM,
    knownOpts: knownOpts,
    shortHands: shortHands,
    masterDefaults: {
        // specific to this tool
        directory       : process.cwd(),
        match           : '**/*.less',
        ignores         : ['**/_*.less'],
        workers         : Math.min(require('os').cpus().length, MAX_WORKERS)
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
            parsed.paths = parsed.paths[0].split(PATH_DELIM).map(path.resolve);
        }

        return parsed;
    },
    _getUsage: function () {
        return [
            'less-cluster v' + cli._getVersion(),
            '',
            'Usage:',
            '    less-cluster [options] [<directory>]',
            '',
            '    If the -d/--directory option is not passed, it is interpreted as the first',
            '    argument, defaulting to the current working directory.',
            '',
            'Options:',
            '    -d, --directory        Directory to search for LESS source files.         [$CWD]',
            '    -o, --outputdir        Directory to output generated CSS files into.      [$CWD]',
            '    -m, --match            Pattern matching files to be processed.     ["**/*.less"]',
            '    -i, --ignores          Pattern[s] matching files to be ignored. [["**/_*.less"]]',
            '    -w, --workers          Number of workers to spawn.          [cpus.length, max 8]',
            '',
            '    -h, --help             Show this message and exit.',
            '    -v, --version          Show the version and exit.',
            '',
            'LESS Options:',
            '    -I,  --include-path    Path[s] to find imports on.                        [[""]]',
            '    -O,  --optimization    Set the parser optimization level.                    [1]',
            '    -rp, --rootpath        Set the root path prepending relative imports & URLs [""]',
            '    -ru, --relative-urls   Rewrite relative URLs to the base LESS file.',
            '    --no-color             Disable color output.',
            '    -x, --compress         Compress output by removing whitespace.',
            '    --yui-compress         Compress output with ycssmin.',
            '    --line-numbers         Output file line numbers. ["comments"|"mediaquery"|"all"]',
            '    -l, --lint             Syntax check only (no output).',
            '    --strict-imports       Force evaluation of imports.',
            // '    -sm, --strict-maths      Require brackets around mathematic expressions. (1.4.x)',
            // '    -su, --strict-units      Require units of operands to match. (1.4.x)',
            '    --no-strict-maths      Do not require brackets around mathematic expressions. (1.3.x)',
            '    --no-strict-units      Do not require units of operands to match. (1.3.x)',
            '    --legacy               Disable 1.4.x strictness with both math and units.',
            '    -s, --silent           Suppress error messages.',
            '    -V, --verbose          Become extremely talkative.',
            '',
            'Report LESS bugs to: http://github.com/cloudhead/less.js/issues',
            'Further documentation: <http://lesscss.org/>',
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
