model
=====

Evented models

API
---

### model.object()

Returns a collection of setter/getter methods from a setup object

```js
var point = model.object({
  x: 3,
  y: 4
});

point.x(); // returns 3
point.y(5); // sets the value of y to 5 and returns 5
```

Each modification through the setters will emit events notifying the data
change

```js
var point = model.object({
  x: 3,
  y: 4
});

point.on('x', function (newVal, oldVal) {
  console.log('x changed from ' + oldVal + ' to ' + newVal);
});

point.x(7); // logs: x changed from 3 to 7
```

### model.array()

Returns a collection of methods for array management

```js
var line = model.array();

line.insert({
  x: 3,
  y: 4
});
```

Each modification to the array through the provided methods will emit events
notifying the data change

```js
var line = model.array();

line.on('insert', function (item) {
  console.log('new item:', item.value());
});

line.insert({
  x: 3,
  y: 4
});
```
