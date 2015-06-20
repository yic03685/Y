/**
 * Created by ychen on 6/16/15.
 */
var Rx = require('rx');
var bootstrap = require("./bootstrap");
var Observable = require("../build/Observable");
var ModelMap = require("../build/ModelMap");
var Y = require("../build/Y");
var Error = require("../build/Error");
var Constant = require("../build/Constant");
var ConstantProperty = require("../build/ConstantProperty");
var ComputedProperty = require("../build/ComputedProperty");
var StateProperty = require("../build/StateProperty");
var Action = require("../build/Action");
var Util = require("../build/Util");
var Model = require("../build/Model");
var Collection = require("../build/Collection");

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

    it("should work with model", function(){

        var model = new Collection("myModel", {

            c0: new ConstantProperty("c0", [1,2,3]),
            c1: new ConstantProperty("c1", [2,3,4]),
            c2: new ComputedProperty("c2", function *(c0,c1){
                yield Observable.zip(c0,c1,function(a,b){
                    return a+b;
                });

                yield Observable.zip(c0,c1,function(a,b){
                    return a+b;
                }).delay(1000);
            }, ["myModel.c0", "myModel.c1"]),
            c3: new StateProperty("c3", function(action, currentValue, c1){

            }, ["myModel.c1"], "myAction", 10, ["myModel.c0","myModel.c2"])

        });

        sinon.stub(ModelMap,"get", function(){return model});

        model.observe("c3").subscribe(function(x){
            console.log(x);
        });

//        model.observeAll().subscribe(function(x){
//            console.log(x);
//        });

    });


});