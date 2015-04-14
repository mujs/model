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

define('model.dirty', function (require) {
  'use strict';

  var partial  = require('mu.fn.partial'),
      debounce = require('mu.fn.debounce'),
      each     = require('mu.list.each'),
      model    = require('model');

  var addWatcher = function (watchers, expr, listener) {
    watchers.push({
      expr: expr,
      listener: listener
    });
  };

  var digest = function (watchers) {
    each(watchers, function (watch) {
      var value = watch.expr(),
          cached = watch.cached;

      if (value !== cached) {
        watch.listener(value, cached);
        watch.cached = value;
      }
    });
  };

  var dirty = function (defaults) {
    var dirtyModel = model(defaults),
        watchers = [];

    dirtyModel.on('change', debounce(partial(digest, watchers)));
    dirtyModel.watch = partial(addWatcher, watchers);
    dirtyModel.on = defaults.on;
    return dirtyModel;
  };

  return dirty;
});
