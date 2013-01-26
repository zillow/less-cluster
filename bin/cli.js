#!/usr/bin/env node

var args = require('../lib/args');
var zless = require('../lib/zless');
var options = args.parse(process.argv);

if (options) {
    options.cli = true;
    zless(options);
} else {
    args.usage();
}
