/* eslint-env node, mocha */
'use strict';

var expect = require('expect.js');

require('../dependencies/mu.is/src/is');
require('../src/model');

var model;

define.root(function (require) {
  beforeEach(function () {
    model = require('model');
  });
});

describe('model', function () {
  it('should throw without arguments', function () {
    expect(model).withArgs().to.throwException();
  });

  it('should throw if argument is not object or array', function () {
    expect(model).withArgs(true).to.throwException();
    expect(model).withArgs({}).to.not.throwException();
    expect(model).withArgs([]).to.not.throwException();
  });
});
