define('model', function (require) {
  'use strict';

  var isObject = require('mu.is.object');
  var isArray = require('mu.is.array');

  var eventedObject = function (data) {
    return data;
  };

  var eventedArray = function (data) {
    return data;
  };

  var model = function (data) {
    if (isObject(data)) { eventedObject(data); }
    else if (isArray(data)) { eventedArray(); }
    else { throw 'invalid initial data'; }
  };

  return model;
});
