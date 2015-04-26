define('model', function (require) {
  'use strict';

  var isDefined  = require('mu.is.defined'),
      isFunction = require('mu.is.function'),
      partial    = require('mu.fn.partial'),
      map        = require('mu.list.reduce'),
      emitter    = require('mu.api.emitter');

  var getterSetter = function (channel, model, attr, newVal) {
    if (isDefined(newVal)) {
      channel.emit('change', attr, newVal, model[attr]);
      channel.emit(attr, newVal, model[attr]);
      model[attr] = newVal;
    }

    return model[attr];
  };

  var model = function (defaults) {
    var channel = emitter();

    var model = map(defaults, function (item, index) {
      if (isFunction(item)) { return item; };
      return partial(getterSetter, channel, defaults, index);
    });

    model.on = channel.on;
  };

  return model;
});
