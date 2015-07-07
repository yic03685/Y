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
var _ = require("lodash");

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

    it("should work with strings", function() {


        y.createModel({

            name: "List",

            url: "https://commerce1.api.e1-np.km.playstation.net/store/api/ps4/00_09_000/container/US/en/14/",

            startIdx: 0,
            size: 7,

            categoryId: "STORE-MSF4078032-WELCOMEMAT000001",

            response: function (u, c, size, idx) {
                return y.Observable.return(u + c + "?start=" + idx + "&size=" + size).flatMap(function (x) {
                    return RSVP.resove("TEST");
                });
            }.require("url", "categoryId", "size", "startIdx"),

            focusedIdx: 0,

            actions: {
                next: {
                    focusedIdx: function (action, current) {
                        return action.timestamp >= current.timestamp ? current.value + 1 : current.value;
                    }.require("focusedIdx").timestamp().delay(5000)
                },
                prev: {
                    focusedIdx: function (action, current) {
                        return action.timestamp >= current.timestamp ? current.value - 1 : current.value;
                    }.require("focusedIdx").timestamp()
                }
            }

        });

        y.get("List").observe("focusedIdx").subscribe(function(x){

            console.log(x);
        });

        y.actions("next")();

    });

});