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

  var seemsNumber = function (value) {
    return !isNaN(value);
  };

  var getSet = function (emit, root, scheme, attr, value) {
    var type = scheme[attr];

    if (isScalar(value)) {
      if (isNumber(type) && seemsNumber(value)) { value = Number(value); }
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

    var modelInstance = map(root, function (item, index) {
      if (isScalar(item)) {
        return partial(getSet, channel.emit, root, scheme, index);
      }

      if (isFunction(item)) {
        return function () {
          return item(modelInstance);
        };
      }

      var childModel = model(item);
      childModel.on('event', partial(channel.emit, index));
      return childModel;
    });

    var update = function (tree) {
      if (!tree) { tree = scheme; }
      else if (isFunction(tree.snapshot)) { tree = tree.snapshot(); }

      traverse(merge(scheme, tree), function (item, index) {
        var node = path(modelInstance, index);

        if (isScalar(item) && isFunction(node)) { node(item); }
        else if (isArray(item) && isFunction(node.reset)) {
          node.reset(item);
        }
      });
    };

    var snapshot = function () {
      return map(root, function (node, index) {
        if (isFunction(node)) { return node(modelInstance); }
        if (isScalar(node)) { return node; }
        return modelInstance[index].snapshot();
      });
    };

    modelInstance = merge(modelInstance, channel, {
      update: update,
      snapshot: snapshot,
      scheme: function () { return scheme; }
    });

    return modelInstance;
  };

  var modelList = function (scheme) {
    var models = [],
        channel = events();

    var list = {
      insert: function (item) {
        var modelInstance = modelFactory(scheme);
        modelInstance.update(item);
        models.push(modelInstance);
        channel.emit('insert', modelInstance, partial(list.remove, modelInstance));
        modelInstance.on('event', partial(channel.emit, 'change', modelInstance));
        return modelInstance;
      },
      remove: function (modelInstance) {
        remove(models, modelInstance);
        channel.emit('remove', modelInstance);
      },
      reset: function (newModels) {
        if (!isArray(newModels)) { return; }
        each(models, list.remove);
        each(newModels, list.insert);
      },
      snapshot: function () {
        return map(models, function (modelInstance) {
          return modelInstance.snapshot();
        });
      }
    };

    return merge(list, channel);
  };

  var model = function (scheme) {
    if (isArray(scheme)) { return modelList(scheme[0]); }
    return modelFactory(scheme);
  };

  return model;
});
