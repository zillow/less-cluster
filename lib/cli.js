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
    'workers'   : Number,

    // passed through to less (non-dashed env properties)
    'paths'         : [path, Array],
    'optimization'  : [0, 1, 2],
    'maxLineLen'    : Number,
    'rootpath'      : String,
    'relativeUrls'  : Boolean,
    'color'         : Boolean,
    'compress'      : Boolean,
    'yuicompress'   : Boolean,
    'dumpLineNumbers': ['comments', 'mediaquery', 'all'],
    'lint'          : Boolean,
    'strictImports' : Boolean,
    'strictMath'    : Boolean,
    'strictUnits'   : Boolean,
    'silent'        : Boolean,
    'verbose'       : Boolean,
    'ieCompat'      : Boolean,

    // general cli
    'help'      : Boolean,
    'quiet'     : Boolean,
    'version'   : Boolean
};
var shortHands = {
    // specific to this tool
    'd': ['--directory'],
    'o': ['--outputdir'],
    'm': ['--match'],
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
    'sm':['--strictMath'],
    'su':['--strictUnits'],
    's': ['--silent'],
    'V': ['--verbose'],

    // translate dashed flags to camelCase options
    'include-path'  : ['--paths'],
    'relative-urls' : ['--relativeUrls'],
    'yui-compress'  : ['--yuicompress'],
    'line-numbers'  : ['--dumpLineNumbers'],
    'strict-imports': ['--strictImports'],
    'strict-math'   : ['--strictMath'],
    'strict-units'  : ['--strictUnits'],
    'ie-compat'     : ['--ieCompat'],
    'no-ie-compat'  : ['--no-ieCompat'],
    'max-line-len'  : ['--maxLineLen'],

    // Avoids most 1.4.x back-compat issues
    'legacy': ['--no-strictMath', '--no-strictUnits'],

    // general cli
    'h': ['--help'],
    'q': ['--quiet'],
    'v': ['--version']
};

// Cap workers to 8 maximum, unless overridden by CLI option,
// which avoids spawning too many processes on beefy boxen.
var MAX_WORKERS = 8;

// Back-compat for -I option, which may resemble a PATH value
// ("foo/bar:baz/qux") if passed only one value.
var PATH_DELIM = path.delimiter;

var cli = module.exports = {
    MAX_WORKERS: MAX_WORKERS,
    PATH_DELIM: PATH_DELIM,
    knownOpts: knownOpts,
    shortHands: shortHands,
    masterDefaults: {
        // specific to this tool
        directory       : process.cwd(),
        match           : '**/*.less',
        workers         : Math.min(require('os').cpus().length, MAX_WORKERS)
    },
    workerDefaults: {
        // passed through to less
        paths           : [],
        optimization    : 1,
        maxLineLen      : -1,
        rootpath        : '',
        relativeUrls    : false,
        color           : true,
        compress        : false,
        yuicompress     : false,
        dumpLineNumbers : false,
        lint            : false,
        strictImports   : false,
        strictMath      : false,
        strictUnits     : false,
        ieCompat        : true,
        silent          : false,
        verbose         : false
    },
    parse: function (argv, slice) {
        // console.log(argv);
        var parsed = nopt(knownOpts, shortHands, argv, slice);
        return cli.clean(parsed);
    },
    clean: function (parsed) {
        // shallow copy of remaining args, if they exist
        var remain = parsed.argv && parsed.argv.remain.slice() || [];

        // --silent implies --quiet
        if (parsed.silent) {
            parsed.quiet = true;
        }

        // --quiet disables --verbose
        if (parsed.quiet) {
            parsed.verbose = false;
        }

        // treat first remaining arg as directory if not passed via option
        if (!parsed.directory && remain.length) {
            parsed.directory = path.resolve(remain.shift());
        }

        // treat second remaining arg as outputdir if not passed via option
        if (!parsed.outputdir && remain.length) {
            parsed.outputdir = path.resolve(remain.shift());
        }

        // ad-hoc files passed
        if (remain.length) {
            // resolve onto directory
            parsed._files = remain.map(function (file) {
                return path.resolve(parsed.directory, file);
            });
        }

        // if single include-path provided, assume it's the old syntax
        if (parsed.paths && parsed.paths.length === 1 && parsed.paths[0].length) {
            parsed.paths = parsed.paths[0].split(PATH_DELIM).map(cli._mapIncludePath);
        }

        return parsed;
    },
    _mapIncludePath: function (pathString) {
        return path.resolve(pathString);
    },
    _getUsage: function () {
        // it's a wee bit brittle, but serves our purposes
        var readme = require('fs').readFileSync(path.join(__dirname, '../README.md'), 'utf8'),
            content = readme.substring(readme.indexOf('```txt') + 6, readme.lastIndexOf('```'));
        return [
            'less-cluster v' + cli._getVersion(),
            content
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
