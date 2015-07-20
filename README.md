# Y

## What is Y?
Y is a lightweight library implementing the [flux pattern](https://facebook.github.io/flux/docs/overview.html) with [Rx.js](https://github.com/Reactive-Extensions/RxJS), providing easy-to-use APIs based on observables. You can build models with Y for partial or entire app.
Y targets creating models (M in the MVC terminology) for your app which are independent to whichever V your app is using.

## Why Y?
While there are many libraries that implement the flux pattern, Y chooses a more restricted way to manage states and dependencies with observables. It helps you make your model easier to manage and scale. For Rx.js users, building the models with Rx only could be tricky sometimes. Y saves you from dealing with things like caching and syntax.

## Install
```
bower install y-js
```
In the beta version, the library would expose a global variable called `y`. In the stable version, it would be served in either amd or commonjs format.

## How does it work?
The smallest unit in Y is a property, which is not a model. Model is a collection of properties while the goal of model is only for providing properties a meaningful place to sit it.
In Y, there are two types of properties **State Property** and **Computed Property**

### State Property
State properties are properties which do not have any dependencies. In Rx's terminology, it serves as both an observer and an observable.
Ususally it has some initial value that can be changed by some user's action. The initial value can be any javascript primitive or an array.
For example, a User model which has two properties "firstName" and "lastName" would look like this:
```
y.createModel({
  name: "User", // "name" is a reserved property for specifying model name
  firstName: "John",
  lastName: "Doe"
});
```
### Computed Property
Computed properties are properties who can be derived from other properties (whether they are states or other computed properties.) It is similar to observable in Rx.
For example, a property called "fullName" which can be derived by "firstName" and "lastName" would look like this:
```
y.createModel({
  name: "User", // "name" is a reserved property for specifying model name
  firstName: "John",
  lastName: "Doe",
  fullName: function(first, last) {
    return `{first} {last}`;
  }.require("firstName", "lastName")
});
```
Computed properties can also depend on properties from other models. If you have another model called "Config" and you do not want to show the last name in the full name if it is configured to be private.
```
y.createModel({
  name: "Config", // "name" is a reserved property for specifying model name
  privacy: "private"
});
y.createModel({
  name: "User", // "name" is a reserved property for specifying model name
  firstName: "John",
  lastName: "Doe",
  fullName: function(first, last, privacy) {
    return privacy === "private"? first : `{first} {last}`;
  }.require("firstName", "lastName", "Config.privacy")
});
```
#### Dealing with arrays
If the dependency is an array of values, the generator (the computing function) would receive an array as parameter. For instance:
```
y.createModel({
  name: "Model",
  items: [1,2,3,4],
  newItems: function(items) {
    return items.map(x=>x+1);
  }.require("items")
});
y.get("Model").observe("newItems").subscribe((ls)=>console.log(ls)) // [2,3,4,5]
```
#### Observable vs Iterable
If you're not familiar with observables, I would recommend viewing some talks about observables versus iterables. Observables and iterables are interchangable while each having its own specialties.
You can think of observables = iterables + time. It can do everything an iterable can do and also some operations on time domain; however, it's not as good for some operations like random access.
Fortunately in Y, you can freely to choose whichever makes more sense for your operation.
The parameters passed into the generator will be in the form of an array and the after hook will be in the form of observables
The previous example has the following equivalent counterpart in the form of observables:
```
y.createModel({
  name: "Model",
  items: [1,2,3,4],
  newItems: function(items) {
    return items
  }.require("items").map((x)=>x+1)
});
y.get("Model").observe("newItems").subscribe((x)=>console.log(x)) // [2,3,4,5]
```
However, there are some operations that can not be done in the form of arrays.
For example, if you want to debounce for the new items, it could be easily done with observables 
```
y.createModel({
  name: "Model",
  items: [1,2,3,4],
  newItems: function(items) {
    return items
  }.require("items").map((x)=>x+1).debounce()
});
y.get("Model").observe("newItems").subscribe((x)=>console.log(x)) // [2,3,4,5]
```

### Observe a property
No properties would be initialized until you observe it. Both model and collection provide with an observe method to observe one or many properties.
For example, if you want to observe the fullName from the User model
```
y.get("User").observe("fullName").subscribe((name)=>console.log(name))
```
By doing this, whenever the firstName or lastName is changed, the callback function registered would be called and passed the latest full name as the parameter.
You can also have a circular reference between models since properties are actually the smallest units in Y (as long as there's no circular references between properties).
```
y.createModel({
  name: "A", 
  foo: 1,
  bar: function(bar) {
    return bar;
  }.require("B.bar")
});
y.createModel({
  name: "B", 
  bar: function(foo) {
    return foo;
  }.require("A.foo")
});
y.get("A").observe("bar").subscribe((bar)=>...)
```
### Action
In flux, there are actions that change some states of your models. It works the same way in Y while it's obvious actions can only change **state properties**
Take the User model as an example, if I want to change the name when user triggers some interaction:
```
y.createModel({
  name: "User", // "name" is a reserved property for specifying model name
  firstName: "John",
  lastName: "Doe",
  fullName: function(first, last) {
    return `{first} {last}`;
  }.require("firstName", "lastName"),
  actions: { // "actions" is a reserved property for specifying all the actions
    changeName: { // "an action called changeName" which is an object contains all the states that will be affected by this action
      firstName: function(evt) {
        return evt.firstName;
      },
      lastName: function(evt) {
        return evt.lastName;
      },
    }
  }
});
// Assume you trigger the action inside some action handler in the view
function onClick(evt) {
  y.action("changeName")({
    firstName: "Alice",
    lastName "Chen"
  })
}
```
Action handlers are similar to computed properties. As a result, it can also be specified with dependencies. If you want to specify a default last name for the example above, you can do the following:
```
y.createModel({
  name: "User", // "name" is a reserved property for specifying model name
  firstName: "John",
  lastName: "Doe",
  defaultLastName: "MyLastName"
  fullName: function(first, last) {
    return `{first} {last}`;
  }.require("firstName", "lastName"),
  actions: { // "actions" is a reserved property for specifying all the actions
    changeName: { // "an action called changeName" which is an object contains all the states that will be affected by this action
      firstName: function(evt) {
        return evt.firstName;
      },
      lastName: function(evt, defaultLN) {
        return evt.lastName? evt.lastName : defaultLN;
      }.require("defaultLastName"),
    }
  }
});
```

### Model and Collection
Since properties are the actual functioning units in Y, Model and Collection are the same while providing different helper method.
In all of the examples above, you could also change to
```
y.createCollection({
  ...
})
```
The only difference is when you call observe on collection, it would assume the observing values are arrays with the same length (it would use the minimum length across all the observed properties)
Ex.
```
y.createCollection({
  name: "MyCollection",
  foo: [1,2,3],
  bar: ["one", "two"]
})
y.get("MyCollection").observe("foo","bar").subscribe((x)=>console.log(x)) // [{foo:1, bar:"one"},{foo:2, bar:"two"}]
```
