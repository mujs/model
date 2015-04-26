define('model.dirty', function (require) {
  'use strict';

  var partial  = require('mu.fn.partial'),
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

    dirtyModel.on('change', partial(digest, watchers));
    dirtyModel.watch = partial(addWatcher, watchers);
    return dirtyModel;
  };

  return dirty;
});
