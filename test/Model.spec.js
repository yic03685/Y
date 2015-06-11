var Rx = require('rx');
var bootstrap = require("./bootstrap");
var Model = require("../build/Model");
var StatelessModel = require("../build/StatelessModel");
var Observable = require("../build/Observable");
var RSVP = require("rsvp");
var ModelMap = require("../build/ModelMap");
var Y = require("../build/Y");
var Error = require("../build/Error");
var Constant = require("../build/Constant");

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

describe("StatelessModel", function(){

//    describe("experiment", function(){
//
//        Y.createModel({
//            name: "GeomModel",
//            properties: {
//                x:0,
//                y:0
//            },
//            actions: {
//                move: function(param, document) {
//                    document.x = Math.random() * 200;
//                    document.y = Math.random() * 200;
//                }
//            }
//        });
//
//        Y.createModel({
//            name: "SizeModel",
//            properties: {
//                width: 100,
//                height: 100
//            },
//            actions: {
//                move: function(param, document) {
//                    document.width = Math.random() * 200;
//                    document.height = Math.random() * 200;
//                }
//            }
//        });
//
//        var model = Y.createModel({
//            name: "RectModel",
//            properties: {
//                left: function(x, y, width, height) {
//                    function postfix(x) {
//                        return ""+x+"px";
//                    }
//                    return {
//                        left: x.map(postfix),
//                        top: y.map(postfix),
//                        width: width.map(postfix),
//                        height: height.map(postfix)
//                    };
//                }.require("GeomModel.x", "GeomModel.y", "SizeModel.width", "SizeModel.height"),
//                top: "left",
//                width: "left",
//                height: "left",
//                backgroundColor: function(self, left, i) {
//                    console.log(i);
//                    var colorArray = ["red","blue","green","pink","yellow","black"];
//                    return i<100? Observable.return(Observable.return(colorArray[i]).delay(1000)) : Observable.return(colorArray[i]);
//                }.require("self","RectModel.top")
//            }
//        });
//
//        model.backgroundColor.subscribe(function(x){
////            console.log(x);
//        }, function(err){
//            console.log(err);
//        });
//
//        model.top.subscribe(function(x){
////            console.log(x);
//        });
//
//
//
//        model.action("move")();
//
//        setTimeout(function(){
//            model.action("move")();
//        },3500);
//
//
//    });

    describe("getExtDependencyProperty", function(){

        var testFunc;
        before(function(){
            testFunc =  StatelessModel.prototype.getExtDependencyProperty;
            sinon.stub(ModelMap, "get", function(name) {
                return {myProp:{
                    "do":function(v){return {};}
                }};
            });
        });

        after(function(){
           ModelMap.get.restore();
        });

        describe("when the property is found", function(){

            it("should get one property", function(){
                expect(testFunc("MyModel.myProp")).deep.equal({});
            });
        });

        describe("when the property is not found", function(){

            it("should get a null", function(){
                expect(testFunc("MyModel.myProp2")).deep.equal(null);
            });
        });
    });

    describe("getIntDependencyProperty", function() {

        var testFunc, context;
        before(function () {
            testFunc = StatelessModel.prototype.getIntDependencyProperty;
            var map = {};
            var timeCounterMap = {};
            context = {
                observables: {
                    set: function(key, value) {
                        map[key] = value;
                    },
                    get: function(key) {
                        return map[key];
                    }
                },
                timeCounters: {
                    set: function(key, value) {
                        timeCounterMap[key] = value;
                    },
                    get: function(key) {
                        return timeCounterMap[key];
                    },
                    has: function(key) {
                        return !!timeCounterMap[key];
                    }
                }
            }
        });

        it("should return a observable", function(){
           expect(Observable.isObservable(testFunc.call(context,"myProp"))).equal(true);
        });

        it("should add an observable in the map for the executing context", function(){
            testFunc.call(context,"myProp");
            expect(Observable.isObservable(context.observables.get("myProp"))).equal(true);
        });
    });

    describe("compute", function() {

        describe("when there is no loop", function(){

            var testFunc, context, dependencyProperties;
            before(function () {
                testFunc = StatelessModel.prototype.compute;
                var map = {};
                var timeCounterMap = {};
                context = {
                    observables: {
                        set: function(key, value) {
                            map[key] = value;
                        },
                        get: function(key) {
                            return map[key];
                        },
                        has: function(key) {
                            return !!map[key];
                        }
                    },
                    timeCounters: {
                        set: function(key, value) {
                            timeCounterMap[key] = value;
                        },
                        get: function(key) {
                            return timeCounterMap[key];
                        },
                        has: function(key) {
                            return !!timeCounterMap[key];
                        }
                    },
                    documents: [],
                    applyPropertyValuesToDocuments: StatelessModel.prototype.applyPropertyValuesToDocuments,
                }
            });

            describe("when it is a many to one template", function(){

                var template, subscription, property0, property1, counter;

                beforeEach(function(){
                    property0 = new Rx.BehaviorSubject();
                    property1 = new Rx.BehaviorSubject();
                    dependencyProperties = [property0, property1];
                    template = function(a,b,i) {
                        counter = i;
                        return Observable.combineLatest(a,b,function(x,y){
                            return x+y;
                        });
                    };
                    property0.onNext([1]);
                    property1.onNext([2]);
                });

                afterEach(function(){
                    cancelSubscription(subscription);
                    context.documents = [];
                });

                it("should return a observable", function(){
                    expect(Observable.isObservable(testFunc.call(context, "myProp", template, dependencyProperties))).equal(true);
                });

                it("should deliver the correct value", function(done){
                    subscription = testFunc.call(context, "myProp", template, dependencyProperties).subscribe(function(v){
                        expect(v).deep.equal([3]);
                        done();
                    });
                });

                it("should change the document value", function(done){
                    subscription = testFunc.call(context, "myProp", template, dependencyProperties).subscribe(function(v){
                        expect(context.documents).deep.equal([{myProp:3}]);
                        done();
                    });
                });

                it("should reactivate after the source changed and counter remains as 0", function(done){
                    var actual = [];
                    subscription = testFunc.call(context, "myProp", template, dependencyProperties).subscribe(function(v){
                        actual.push(v);
                        if(actual.length===2){
                            expect(actual).deep.equal([[3],[4]]);
                            done();
                        }
                    });
                    property0.onNext([2]);
                });

                it("won't deliver the same value twice", function(done){
                    var actual = [];
                    subscription = testFunc.call(context, "myProp", template, dependencyProperties).subscribe(function(v){
                        actual.push(v);
                        if(actual.length === 2) {
                            expect(actual).deep.equal([[3],[4]]);
                            done();
                        }
                    });
                    property0.onNext([2]);
                    property0.onNext([2]);
                });

                it("should be able to deliver to multiple listeners", function(done){
                    var actual = [];
                    subscription = [];
                    subscription[0] = testFunc.call(context, "myProp", template, dependencyProperties).subscribe(function(v){
                        actual.push(v);
                    });

                    subscription[1] = testFunc.call(context, "myProp", template, dependencyProperties).subscribe(function(v){
                        actual.push(v);
                        if(actual.length === 4) {
                            expect(actual).deep.equal([[3],[3],[4],[4]]);
                            done();
                        }
                    });
                    property0.onNext([2]);
                    property0.onNext([2]);
                });
            });

            describe("when it is a many to many template", function(){

                var template, subscription, property0, property1, counter;
                beforeEach(function () {
                    property0 = new Rx.BehaviorSubject();
                    property1 = new Rx.BehaviorSubject();
                    dependencyProperties = [property0, property1];
                    template = function(a,b,i) {
                        counter = i;
                        var obs = Observable.combineLatest(a,b,function(x,y){
                            return x+y;
                        });
                        return {
                            myProp: obs,
                            myProp2: obs
                        };
                    };
                    property0.onNext([1]);
                    property1.onNext([2]);
                });

                afterEach(function(){
                    cancelSubscription(subscription);
                    context.documents = [];
                });

                it("should return a observable", function(){
                    expect(Observable.isObservable(testFunc.call(context, "myProp2", template, dependencyProperties))).equal(true);
                });

                it("should deliver the correct value", function(done){
                    subscription = testFunc.call(context, "myProp2", template, dependencyProperties).subscribe(function(v){
                        expect(v).deep.equal([3]);
                        done();
                    });
                });

                it("should change the document value", function(done){
                    subscription = testFunc.call(context, "myProp2", template, dependencyProperties).subscribe(function(v){
                        expect(context.documents).deep.equal([{myProp2:3}]);
                        done();
                    });
                });

                it("should reactivate after the source changed and counter remains as 0", function(done){
                    var actual = [];
                    subscription = testFunc.call(context, "myProp2", template, dependencyProperties).subscribe(function(v){
                        actual.push(v);
                        if(actual.length===2){
                            expect(actual).deep.equal([[3],[4]]);
                            done();
                        }
                    });
                    property0.onNext([2]);
                });

                it("won't deliver the same value twice", function(done){
                    var actual = [];
                    subscription = testFunc.call(context, "myProp2", template, dependencyProperties).subscribe(function(v){
                        actual.push(v);
                        if(actual.length === 2) {
                            expect(actual).deep.equal([[3],[4]]);
                            done();
                        }
                    });
                    property0.onNext([2]);
                    property0.onNext([2]);
                });

                it("should be able to deliver to multiple listeners", function(done){
                    var actual = [];
                    subscription = [];
                    subscription[0] = testFunc.call(context, "myProp2", template, dependencyProperties).subscribe(function(v){
                        actual.push(v);
                    });

                    subscription[1] = testFunc.call(context, "myProp2", template, dependencyProperties).subscribe(function(v){
                        actual.push(v);
                        if(actual.length === 4) {
                            expect(actual).deep.equal([[3],[3],[4],[4]]);
                            done();
                        }
                    });
                    property0.onNext([2]);
                    property0.onNext([2]);
                });
            });
        });

        describe("when there is a loop", function(){

            var testFunc, context, dependencyProperties;
            before(function () {
                testFunc = StatelessModel.prototype.compute;
                var map = {};
                var counterMap = {};
                context = {
                    documents: [],
                    observables: {
                        set: function(key, value) {
                            map[key] = value;
                        },
                        get: function(key) {
                            return map[key];
                        },
                        has: function(key) {
                            return !!map[key];
                        }
                    },
                    timeCounters: {
                        set: function(key, value) {
                            counterMap[key] = value;
                        },
                        get: function(key) {
                            return counterMap[key];
                        },
                        has: function(key) {
                            return !!counterMap[key];
                        }
                    },
                    applyPropertyValuesToDocuments: StatelessModel.prototype.applyPropertyValuesToDocuments,
                    handleLoop: StatelessModel.prototype.handleLoop,
                    counter: 0
                };
                StatelessModel.prototype.getIntDependencyProperty.call(context , "myProp");
            });

            describe("when it is a many to one template", function(){

                var template, subscription, extProperty, counter;
                beforeEach(function () {
                    extProperty = new Rx.BehaviorSubject();
                    dependencyProperties = [context.observables.get("myProp"), extProperty];
                    template = function(a,b,i) {
                        counter = i;
                        return i<4? Observable.return(Observable.combineLatest(a,b,function(x,y){
                            return (x||0)+ y;
                        })): Observable.combineLatest(a,b, function(x,y){
                            return x+y;
                        });
                    };
                    extProperty.onNext([1]);
                });

                afterEach(function(){
                    cancelSubscription(subscription);
                });

                it("should return a observable", function(){
                    expect(Observable.isObservable(testFunc.call(context, "myProp", template, dependencyProperties))).equal(true);
                });

                it("should deliver the correct value", function(done){
                    var actual = [];
                    subscription = testFunc.call(context, "myProp", template, dependencyProperties).subscribe(function(v){
                        actual = actual.concat(v);
                        if(actual.length === 5) {
                            expect(actual).deep.equal([1,2,3,4,5]);
                            done();
                        }
                    },function(err){
                        console.log(err);
                    });
                });
            });

        });
    });

});
