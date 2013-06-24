# less-cluster

A utility to make lessc's CLI more performant for large directories of LESS files.

## Install

    npm -g install less-cluster

## Usage

`less-cluster` is designed to be used on entire directories of LESS files, with output generally redirected to a different directory while maintaining the subdirectory structure of the source tree.

```txt
Usage:
    less-cluster [options] [directory] [outputdir] [files...]

    If the -d/--directory option is not passed, it is interpreted as the first
    argument, defaulting to the current working directory.

    Likewise, if the -o/--outputdir option is omitted, it is interpreted as the
    second argument, defaulting to the --directory.

    Any additional file arguments will be treated as filters limiting the top-
    level imports to the denoted files. The dependents and consumers of these
    files will also be built, as well.

Options:
    -d, --directory        Directory to search for LESS source files.         [$CWD]
    -o, --outputdir        Directory to output generated CSS files into.      [$CWD]
    -m, --match            Pattern matching files to be processed.     ["**/*.less"]
    -w, --workers          Number of workers to spawn.          [cpus.length, max 8]

    -q, --quiet            Only log errors, disabling --verbose.
    -h, --help             Show this message and exit.
    -v, --version          Show the version and exit.

LESS Options:
    -I,  --include-path    Path[s] to find imports on.                        [[""]]
    -O,  --optimization    Set the parser optimization level.                    [1]
    -rp, --rootpath        Set the root path prepending relative imports & URLs [""]
    -ru, --relative-urls   Rewrite relative URLs to the base LESS file.
    --no-color             Disable color output.
    -x, --compress         Compress output by removing whitespace.
    --yui-compress         Compress output with ycssmin.
    --line-numbers         Output file line numbers. ["comments"|"mediaquery"|"all"]
    -l, --lint             Syntax check only (no output).
    --strict-imports       Force evaluation of imports.
    -sm, --strict-math     Require brackets around mathematical expressions. (1.4.x)
    -su, --strict-units    Require units of operands to match. (1.4.x)
    --no-ie-compat         Do not limit data-uri embedding to 32KB (IE8)
    --legacy               Disable 1.4.x strictness with both math and units.
    -s, --silent           Suppress error messages. (Implies --quiet)
    -V, --verbose          Become extremely talkative.

Report LESS bugs to http://github.com/cloudhead/less.js/issues
Further documentation: <http://lesscss.org/>
```

## License (MIT)

Copyright (c) 2013 Zillow Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
