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

        sinon.stub(ModelMap, "get", function(){
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

        comProp.observable.flatMap(function(x){return x}).subscribe(function(x){
            console.log(x);
        });

        actionIn.onNext(Observable.return(1));
        actionIn.onNext(Observable.return(1));

    });


});