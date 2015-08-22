define('model', function (require) {
  'use strict';

  var isBoolean  = require('mu.is.boolean'),
      isNumber   = require('mu.is.number'),
      isString   = require('mu.is.string'),
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

      if (value !== root[attr]) {
        emit(attr, value, root[attr]);
        root[attr] = value;
      }
    }

    return root[attr];
  };

  var modelFactory = function (scheme) {
    var root = copy(scheme),
        channel = events();

    var model = map(root, function (item, index) {
      if (isScalar(item)) {
        return partial(getSet, channel.emit, root, scheme, index);
      }

      if (isFunction(item)) { return function () { return item(model); }; }

      var node = null;
      if (isObject(item)) { node = modelFactory(item); }
      if (isArray(item)) { node = modelList(item[0]); }

      node.on('event', partial(channel.emit, index));
      return node;
    });

    var update = function (tree) {
      if (!tree) { tree = scheme; }
      else if (isFunction(tree.snapshot)) { tree = tree.snapshot(); }

      traverse(tree, function (item, index) {
        var node = path(model, index);

        if (isScalar(item) && isFunction(node)) { node(item); }
        else if (isArray(item) && isFunction(node.reset)) {
          node.reset(item);
        }
      });
    };

    var snapshot = function () {
      return map(root, function (node) {
        if (isFunction(node)) { return node(); }
        if (isFunction(node.snapshot)) { return node.snapshot(); }
        return node;
      });
    };

    model = merge(model, channel, {
      update: update,
      snapshot: snapshot,
      scheme: function () { return scheme; }
    });

    return model;
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
