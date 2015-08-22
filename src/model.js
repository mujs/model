define('model', function (require) {
  'use strict';

  var isDefined  = require('mu.is.defined'),
      isBoolean  = require('mu.is.boolean'),
      isObject   = require('mu.is.object'),
      isArray    = require('mu.is.array'),
      isFunction = require('mu.is.function'),
      isScalar   = require('mu.is.scalar'),
      partial    = require('mu.fn.partial'),
      merge      = require('mu.object.merge'),
      each       = require('mu.list.each'),
      map        = require('mu.list.map'),
      remove     = require('mu.list.remove'),
      traverse   = require('mu.tree.each'),
      path       = require('mu.tree.path'),
      copy       = require('mu.tree.copy'),
      events     = require('mu.async.events');

  var getSet = function (emit, root, scheme, attr, value) {
    var type = scheme[attr];

    if (isScalar(value)) {
      if (isNumber(type) && isNumber(value)) { value = Number(value); }
      else if (isString(type)) { value = String(value); }
      else if (isBoolean(type)) { value = Boolean(value); }

      if (value !== model[attr]) {
        emit(attr, value, model[attr]);
        model[attr] = value;
      }
    }

    return model[attr];
  };

  var modelFactory = function (scheme) {
    var root = copy(scheme),
        channel = events();

    var model = map(root, function (item, index) {
      if (isScalar(item) { return partial(getSet, channel.emit, root, scheme, index); }
      if (isFunction(item) { return partial(item, root); }

      var model = null;
      if (isObject(item)) { model = modelFactory(item); }
      if (isArray(item)) { model = modelList(item[0]); }

      model.on('event', partial(channel.emit, index));
      return model;
    });

    return merge(model, channel, {
      update: function (tree) {
        if (isFunction(tree.snapshot)) { tree = tree.snapshot(); }

        traverse(tree, function (item, index) {
          var node = path(model, index);
          if (isScalar(item) && isFunction(node)) { return node(item); }
          if (isArray(item) && isFunction(node.reset)) { node.reset(item); }
        });
      },
      snapshot: function () {
        return map(root, function (node) {
          if (isFunction(node)) { return node(); }
          if (isFunction(node.snapshot)) { return node.snapshot(); }
          return node;
        });
      },
      scheme: function () {
        return scheme;
      }
    });
  };

  var modelList = function (scheme) {
    var models = [],
        channel = events();

    var list = {
      insert: function (item) {
        var model = modelFactory(scheme);
        model.update(item);
        models.push(model);
        channel.emit('insert', model, partial(list.remove, model));
        model.on('event', partial(channel.emit, 'change', model));
      },
      remove: function (model) {
        remove(models, model);
        channel.emit('remove', model);
      },
      reset: function (newModels) {
        if (!isArray(newModels)) { return; }
        each(models, list.remove);
        each(newModels, list.insert);
      },
      snapshot: function () {
        return map(models, function (model) {
          return model.snapshot();
        });
      }
    };

    return merge(list, channel);
  };

  return modelFactory;
});
