/*global describe, it, before, beforeEach, after, afterEach, chai, should, sinon */
/**
Integration tests for usage as a library (non-CLI)
**/
var fs = require("graceful-fs");
var path = require("path");
var rimraf = require("rimraf");

var LessCluster = require("../../");

var outputsDir = path.resolve(__dirname, "./output/");
var importsDir = path.resolve(__dirname, "../fixtures/imports/");
var includeDir = path.resolve(importsDir, "./included/");

describe("Library Integration", function () {
    beforeEach(function (done) {
        rimraf(outputsDir, done);
    });

    it("builds files when instantiated", function (done) {
        var instance = new LessCluster({
            quiet: true,
            paths: [includeDir],
            directory: importsDir,
            outputdir: outputsDir
        });

        instance.on("start", function () {
            // TODO: verify collected data
        });

        instance.on("finished", function () {
            // TODO: verify output
            instance.destroy();
            done();
        });
    });

    it("builds files in subsequent execution");
});
