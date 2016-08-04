#! /usr/bin/env node

var Horseman = require('node-horseman');
var horseman = new Horseman({ ignoreSSLErrors: true, timeout : 10000 });

var argv = require('minimist')(process.argv.slice(2));

var outputPath = argv.out || './out/';
var defaultRootUrl = argv.rootUrl;

var config = require(argv.suite.replace(/\\/, '/'));
config.rootUrl = config.rootUrl || defaultRootUrl;

horseman
  .userAgent('AutomatedUITesting/0.0.1')
  .do(function (done) {
      testArea(config, 0, done);
  })
  .close();

function testArea(config, ix, doneArea) {
    if(ix >= config.areas.length) {
        console.log('reached the end of config');
        return doneArea();
    }

    var area = config.areas[ix];
    var viewport = area.viewport || config.viewport;
    area.rootUrl = area.rootUrl || config.rootUrl;
    console.log('testing area...', area.name);

    horseman
      .viewport(viewport.width, viewport.height)
      .open(area.rootUrl + config.loginPath)
      .type(config.loginFormUsernameFieldSelector || '#Email', area.username)
      .type(config.loginFormPasswordFieldSelector || '#Password', area.password)
      .click(config.loginFormSubmitButtonSelector || 'form [type=submit]')
      .waitForNextPage()
      .log('logged in to area `'+area.name+'`')
      .do(function (done) {
          testPage(area, 0, done);
      })
      .do(function () {
          testArea(config, ix+1, doneArea)
      });
}

function testPage(area, ix, donePage) {
    if(ix >= area.pages.length) {
        console.log('reached the end of area:', area.name);
        return donePage();
    }

    var page = area.pages[ix];
    page.rootUrl = page.rootUrl || area.rootUrl;
    console.log('testing page...', page.name);
    horseman
      .open(page.rootUrl + page.path)
      .wait(3000)
      .screenshot(outputPath+area.name+'/'+page.name+'.png')
      .do(function () {
          testPage(area, ix+1, donePage);
      });
}
