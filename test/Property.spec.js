/**
 * Created by ychen on 6/16/15.
 */
var Observable = require("../build/Observable");
var Rx = require('rx');
var bootstrap = require("./bootstrap");
var ModelMap = require("../build/ModelMap");
var y = require("../build/Y");
var Error = require("../build/Error");
var Constant = require("../build/Constant");
var StateProperty = require("../build/StateProperty");
var ComputedProperty = require("../build/ComputedProperty");
var Action = require("../build/Action");
var Util = require("../build/Util");
var Model = require("../build/Model");
var Collection = require("../build/Collection");
var ActionHandler = require("../build/ActionHandler");
var RSVP = require("rsvp");

function isObservable(obj){
    return !!(obj && obj.subscribe);
}

function cancelSubscription(subscription) {
    if(subscription) {
        var subscriptions = Array.isArray(subscription)? subscription:[subscription];
        subscriptions.forEach(function(sub){
            sub.dispose();
        });
    }
}

describe("Property", function(){

//    it("should rock", function(){
//
//        var cProp = new ConstantProperty("constantProperty", [1,2]);
//        var cProp2 = new ConstantProperty("constantProperty2", 2);
//
//        sinon.stub(ModelMap, "get", function(){
//            return {
//                properties: {
//                    constantProperty: cProp,
//                    constantProperty2: cProp2
//                }
//            }
//        });
//
//
////        cProp.observable.subscribe(function(x){
////            console.log(x);
////        });
//
//
//        var comProp = new ComputedProperty("computedProperty2", function* (cProp, cProp2){
//            for(var i=0; i<5; ++i) {
//                yield Observable.combineLatest(cProp, cProp2, function(x,y){
//                    return x+y;
//                }).delay(i*1000);
//            }
//        },  ["SomeModel.constantProperty", "SomeModel.constantProperty2"]);
//
//        var comProp2 = new ComputedProperty("computedProperty2", function (cProp, cProp2){
//            return Observable.combineLatest(cProp, cProp2, function(x,y){
//                return x*y;
//            });
//        },  ["SomeModel.constantProperty", "SomeModel.constantProperty2"]);
//
//
//        comProp.observable.flatMap(function(x){return x}).subscribe(function(x){
//            console.log(x);
//        });
//
//        comProp2.observable.flatMap(function(x){return x}).subscribe(function(x){
//            console.log(x);
//        });
//    });

    it("state properties should rock", function(){

        var cProp = new ConstantProperty("constantProperty", [1,2]);

        sinon.stub(ModelMap, "get", function(name){
            return {
                properties: {
                    constantProperty: cProp
                }
            }
        });

        var actionIn = new Rx.Subject();

        sinon.stub(Action, "register", function(){
            return actionIn;
        });

        var comProp = new StateProperty("StateProperty1", function (evt, currentValue, cProp){
            return Observable.combineLatest(evt, currentValue, function(x,y){
                return x+y;
            });

        },  ["SomeModel.constantProperty"], "myAction", 10);

//        comProp.observable.flatMap(function(x){return x}).subscribe(function(x){
//            console.log(x);
//        });

        actionIn.onNext(Observable.return(1));
        actionIn.onNext(Observable.return(1));


    });

    it("should sort topologically", function(){

        function Property(name) {
            this.name = name;
            this.dependencies = [];
        }
        Property.prototype.addDependency = function(props) {
            this.dependencies = this.dependencies.concat(props);
        };
        Property.prototype.getDependencyProperties = function(prop) {
            return this.dependencies;
        };

        var c = new Property("c");
        var a = new Property("a");
        var b = new Property("b");
        var d = new Property("d");
        var e = new Property("e");
        var f = new Property("f");

        a.addDependency([c,b,f]);
        b.addDependency([c,d,e]);
        c.addDependency([d]);

        sinon.stub(Util,"isStateProperty", function(){return true});
        console.log(Action.sort([a,b,c,d,e,f]));

    });

    it("should work with new properties", function(){

        var d = new StateProperty("MyModel.d", [2,20]);
        var a = new StateProperty("MyModel.a", [1,10]);
        var b = new ComputedProperty("MyModel.b", function(a){
            return a.map(function(x){
                return x+100;
            });
        }, ["MyModel.a"]);
        var c = new ComputedProperty("MyModel.c", function(a,b,c){
            return Observable.zip(a,b,c, function(x,y,z){
                return x+y+z;
            });
        }, ["MyModel.a","MyModel.b","MyModel.d"]);
        var all = new ComputedProperty("MyModel.all", function(a,b,c,d){
            return Observable.zip(a,b,c,d,function(){
                return Array.from(arguments).reduce(function(s,x){return s+x});
            });
        }, ["MyModel.a","MyModel.b","MyModel.c", "MyModel.d"]);



        sinon.stub(ModelMap, "get", function(){
           return {
               properties: {
                   a: a,
                   b: b,
                   d: d,
                   c: c,
                   all: all
               }
           }
        });

        var model = new Collection("MyModel", {
            a: a,
            b: b,
            c: c,
            d: d,
            all: all
        }, {
            myAction: {
                a: new ActionHandler("MyModel.a", function(action){
                    return action;//.map(function(x){return [200]});
                })
            }
        });

//        b.observable.subscribe(function(x){
////            console.log(x);
//        });
//
//        c.observable.subscribe(function(x){
//            console.log("c: "+x);
//        });

//        model.observe("a").subscribe(function(x){
//            console.log("a: "+x);
//        });
//
//        model.observe("c").subscribe(function(x){
//            console.log("c: "+x);
//        });
//
        model.observeAll().subscribe(function(x){
            console.log(x);
        });
//
        y.actions("myAction")([2,3]);

    });

    it("should work with strings", function(){

        y.createModel({
            name: "Users",
            api: "someUrl",
            response: function(api) {
                return api.flatMap(function(x) {
                    return x === "someUrl"? RSVP.resolve([
                        {firstName: "yi", lastName: "chen"},
                        {firstName: "jay", lastName: "hung"}
                    ]): RSVP.resolve([
                        {firstName: "lex", lastName: "lacson"},
                        {firstName: "jay", lastName: "hung"}
                    ]);
                });
            }.require("#Users.api"),
            actions: {
                changeApi: {
                    api: function(action) {
                        return Observable.return("otherUrl");
                    }
                }
            }
        });

        y.createCollection({
            name: "User",
            firstName: function(response){
                return response.pluck("firstName");
            }.require("Users.response"),
            lastName: function(response){
                return response.pluck("lastName");
            }.require("Users.response"),
            fullName: function(firstName, lastName){
                return Observable.zip(firstName, lastName, function(x,y){
                    return x+" "+y;
                });
            }.require("User.firstName", "User.lastName")
        });
//
//        y.createCollection({
//            name: "PlusMember",
//            fullName: function(name) {
//                return name.filter(function(x){return x==="yi chen"});
//            }.require("User.fullName")
//        });

//          console.log(y.get("Users").properties["api"]);

        y.get("User").observeAll().subscribe(function(x){
           console.log(x);
        });

//        y.get("Users").observeAll().subscribe(function(x){
//           console.log(x);
//        });

//        y.actions("changeApi")();

//        y.actions("changeName")({firstName:"yi", lastName:"chen"});
//        y.actions("changeName")({firstName:"yi", lastName:"chen"});
//        y.actions("changeName")({firstName:"yi", lastName:"chen"});
//        y.actions("changeName")({firstName:"yi2", lastName:"chen2"});
//        y.actions("changeName")({firstName:"yi2", lastName:"chen"});

    });

    it("should be search", function(){

        y.createModel({
            name: "List",
            api: "someUrl",
            response: function(url) {
                return url.flatMap(function(url){return RSVP.resolve({items:[
                    {content:"1"},{content:"2"},{content:"3"},{content:4}
                ]})});
            }.require("List.api")
        });

        y.createCollection({
            name: "ListItem",
            _isSelected: false,
            $isSelected: false,
            isSelected: function(defaultSelected, currentSelected, response) {
                return currentSelected.timestamp>response.timestamp?currentSelected.value:y.combineLatest(
                    defaultSelected.value, response.value.pluck("items"), function(x,y) {
                        return Array.from({length:y.length}).map(function(_){
                            return x;
                        });
                    }
                );
            }.require("ListItem._isSelected", "ListItem.$isSelected", "List.response").timestamp(),
            actions: {
                toggle: {
                    $isSelected: function(action, current) {
                        return y.combineLatest(action, current.toArray(), function(a,c){
                           c[a] = true;
                           return c;
                        });
                    }.require("ListItem.isSelected")
                }
            }
        });

        y.get("ListItem").observeAll().subscribe(function(x){
            console.log(x);
        });

        setTimeout(function(){
            y.actions("toggle")(3);
        },1000);


    });


});