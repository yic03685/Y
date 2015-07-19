# Y

## What is Y?
Y is a lightweight library implementing the [flux pattern](https://facebook.github.io/flux/docs/overview.html) with [Rx.js](https://github.com/Reactive-Extensions/RxJS), providing with easy-to-use APIs based on observables for creating models for your entire app.
Y is targeting at creating models (M in the MVC terminology) for you app and therefore independent to whichever V your app is using.

## Why Y?
While there are many libraries implementing the flux pattern, Y chooses a more restricted way to manage states and dependencies with observables. It helps you make your model easier to manage and scalable.For Rx.js users, building the models with Rx only could be tricky sometime. Y saves you from dealing with things like caching and provide with a easier syntax.

## How does it work?
The smallest unit in Y is a property, not a model. Model is a collection of property while the goal of model is only for providing properties a meaningful place to sit it.
In Y, there are two types of properties **State Property** and **Computed Property**

### State Property
State properties are those properties who don't have any dependencies. In Rx's terminology, it serves as both an observer and an observable.
Ususally it has some initial value and can be changed by some user's action. The initial value can be anything javascript primitive or an array.
For example, if you have a User model which has 2 properties "firstName" and "lastName". It will be like
```
y.createModel({
  name: "User", // "name" is a reserved property for specifying model name
  firstName: "John",
  lastName: "Doe"
});
```
### Computed Property
Computed properties are properties who can be derived from other properties (whether they are states or other computed properties.) It's similar to observable in Rx.
For example, if you have a property called "fullName" which can be derived by "firstName" and "lastName". It will be like
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
Computed properties can also depend on properties from other models. Say you have another model called "Config" and you don't want to show the last name in the full name if it configures as private.
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
If the dependency is an array of values. The generator (the computing function) will be passed an array as the parameter. ex.
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
If you're not familiar with observables, I'll recommend there are talks about observables vs iterables. Observables and iterables are interchangable and have their specialties.
You can think of observables = iterables + time. It can do everything an iterable can do and also some operations on time domain while it's not as good for some operations like random access.
Fortunately, in Y, you can freely to choose which makes more sense to your operation.
For the parameters passed into the generator will be in the form of an array while the after hook will be in the form of observables
The previuous example has the equivalent counterpart in the form of observables
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
However, there are some operations that cannot be done in the form of arrays.
ex. you want to debounce for the new items. It can be easily done with observables 
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
All the properties won't get initialized until you observe it. Both model and collection provide with an observe method to observe one or many properties of it.
For example, if you want to observe the fullName from the User model
```
y.get("User").observe("fullName").subscribe((name)=>console.log(name))
```
By doing this, whenever the firstName or lastName changed, the callback function registered will be called and be passed the latest full name as the parameter.
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
Take the User model as an example, say I want to change the name when user triggeres some interaction.
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
Action handlers are similar to computed properties. As a result, it can also be specified with dependencies. Ex. if you want to specify a default last name for the example above. You can do
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
Since properties are the actual functioning units in Y. Model and Collection are the same while they provide different helper method.
All the examples above, you can also change to
```
y.createCollection({
  ...
})
```
The only difference is when you call observe on collection, it will assume the observing values are arrays with the same length (it will use the minimum length across all the observed properties)
Ex.
```
y.createCollection({
  name: "MyCollection",
  foo: [1,2,3],
  bar: ["one", "two"]
})
y.get("MyCollection").observe("foo","bar").subscribe((x)=>console.log(x)) // [{foo:1, bar:"one"},{foo:2, bar:"two"}]
```

