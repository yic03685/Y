var Rx = require('rx');
var bootstrap = require("./bootstrap");
var Model = require("../build/Model");
var Observable = require("../build/Observable");
var RSVP = require("rsvp");
var ModelMap = require("../build/ModelMap");
var Y = require("../build/Y");

function isObservable(obj){
    return !!(obj && obj.subscribe);
}

describe("Model", function(){

    it("should work1", function(){

        var model = Y.createModel({
            name: "someModel",
            properties: {
                foo: [1,2,3],
                x: [3,4,5]
            },
            computedProperties: {
                bar: function(model, UserModel) {
                    return UserModel.y.map(function(x){
                        return x+1;
                    });
                }.require("UserModel"),
                bar2: function(model) {
                    return model.foo.map(function(x){
                        return x+2;
                    });
                }
            },
            actions: {
                reset: function(param, document) {
                    document.foo = [10,11];
                }
            }
        });

        var userModel = Y.createModel({
            name: "UserModel",
            properties: {
                x: 1,
                y: 3
            },
            computedProperties: {
                w: function(model, SomeModel) {
                    return SomeModel.bar.map(function(x){
                        return x+1;
                    });
                }.require("someModel")
            },
            actions: {
                reset: function(param, document) {
                    return document.y = 10;
                }
            }
        });

        var statelessModel = Y.createModel({
            name: "Stateless",
            computedProperties: {
//                myProp: function(model, someModel) {
//                    var obs = someModel.foo.map(function(x){
//                        return x+1;
//                    });
//                    return {
//                        myProp: obs.map(function(x){
//                            return x+1;
//                        }),
//                        foo: obs.map(function(x){
//                            return x+2;
//                        })
//                    };
//                }.require("someModel"),
//
//                foo: "myProp",

                x: function(model, userModel) {
                    return userModel.foo.map(function(x){
                        return x+1;
                    });
                }.require("someModel")
            }
        });

//        var sCollection = Y.createCollection({
//            name: "StatelessCollection",
//            computedProperties: {
//                x: function(model, SomeModel){
//                    return SomeModel.foo.map(function(x){
//                        return Observable.from([x+1, Observable.return(x+2).delay(1000)]);
//                    });
//                }.require("someModel")
//            }
//        });

        statelessModel.x.subscribe(function(x){
            console.log(x);
            console.log(model);
            console.log(statelessModel);
        });

        statelessModel.action("reset")();


//        statelessModel.action("reset")();
//        function delay(value, time) {
//            return Observable.return(value).delay(time);
//        }
//
//
//        var t = Rx.Observable.from([1,2,3]).flatMap(function(x){
//            return Rx.Observable.return(x).flatMap(function(x){
//                return Observable.create(function(observer){
//                    observer.onNext(x);
//                    observer.onNext(delay(x+1,1000));
//                    observer.onNext(delay(delay(x+1,1000),2000));
//                    observer.onCompleted();
//                });
//            })
//        }).partition(Observable.isObservable)
//
//        t[1].reduce(function(ls, x){
//            return ls.concat(x);
//        },[]).subscribe(function(x){
//            console.log(x);
//        });
//
//        t[0].flatMap(function(x){return x;}).reduce(function(ls, x){
//            return ls.concat(x);
//        },[]).subscribe(function(x){
//            console.log(x);
//        });



    });

    it("should work", function() {

        var parentSubject = new Rx.Subject();
        var parentSubject2 = new Rx.Subject();

        var proxy = {};

        Object.defineProperty(proxy, "foo", {
           get: function() {
               var subject = new Rx.Subject();
               parentSubject.subscribe(function(x){
                    subject.onNext(x);
                    subject.onCompleted();
               });
               return subject;
           }

        });

        Object.defineProperty(proxy, "bar", {
            get: function() {
                var subject = new Rx.Subject();
                parentSubject.subscribe(function(x){
                    subject.onNext(x+1);
                    subject.onCompleted();
                });
                return subject;
            }

        });


        var source = Observable.combineLatest(
            parentSubject, parentSubject2,
            function(x,y) {
                return {
                    foo: Observable.return(x),
                    bar: Observable.return(y)
                }
            }
        ).flatMap(function(proxy){
                return test(proxy).reduce(function(ls, x){
                    return ls.concat(x);
                },[]);
            });

        function test(proxy) {
            return Observable.combineLatest(
                proxy.foo, proxy.bar,
                function(x,y) {
                    return x+y;
                }
            );
        }

        source.subscribe(function(x){
            console.log(x);
        },function(){}, function(){
            console.log("complete");
        });

        parentSubject.onNext(1);
        parentSubject2.onNext(1);

        setTimeout(function(){
            parentSubject.onNext(2);
        },1000);

    });




    describe("setupProperties", function(){

        var setupProperties, context, subscription;
        beforeEach(function(){
            context = {
                properties : {
                  foo: 1
                },
                output: {},
                changeProperty: function(key, val){
                    this.output[key].onNext(val);
                }
            };
            setupProperties = Model.prototype.setupProperties;
        });

        afterEach(function () {
            subscription = Array.isArray(subscription) ? subscription : [subscription];
            subscription.forEach(cancel);

            function cancel (subscription) {
                if (subscription && subscription.dispose) {
                    subscription.dispose();
                }
            }
        });

        it("should setup getters and setters for properties defined in the template", function(){
            setupProperties.call(context);
            expect(isObservable(context.foo)).equal(true);
        });

        it(", as the getters and setters, should have initial values", function(done){
            setupProperties.call(context);
            subscription = context.foo.subscribe(function(x){
                expect(x).equal(1);
                done();
            });
        });

        it(", as the properties, should be reactivated if given a new value", function(done){
            setupProperties.call(context);
            var actual = [];
            subscription = context.foo.subscribe(function(x){
                actual.push(x);
                if(actual.length === 2) {
                    expect(actual).deep.equal([1,2]);
                    done();
                }
            });
            context.foo = 2;
        });
    });

    describe("setupComputedProperties", function(){

        var setupComputedProperties, context, subscription;
        beforeEach(function(){
            context = {
                computedProperties : {
                    bar: function(model) {
                        return model.foo.map(function(x){
                           return x+1;
                        });
                    },
                    bar2: function(model) {
                        return model.foo.flatMap(function(x){
                           return RSVP.resolve(x+1);
                        });
                    },
                    bar3: function(model) {
                        return Observable.zip(
                            model.foo, model.foo2, function(x,y){
                                return x+y;
                            }
                        )
                    }
                },
                properties: {
                    foo: 1,
                    foo2: 2
                },
                foo: new Rx.ReplaySubject(),
                foo2: new Rx.ReplaySubject()
            };
            setupComputedProperties = Model.prototype.setupComputedProperties;
        });

        afterEach(function () {
            subscription = Array.isArray(subscription) ? subscription : [subscription];
            subscription.forEach(cancel);

            function cancel (subscription) {
                if (subscription && subscription.dispose) {
                    subscription.dispose();
                }
            }
        });

        it("should setup getters and setters for properties defined in the template", function(){
            setupComputedProperties.call(context);
            expect(isObservable(context.bar)).equal(true);
        });

        it(", as the getters and setters, should have initial values", function(done){
            setupComputedProperties.call(context);
            subscription = context.bar.subscribe(function(x){
                expect(x).deep.equal({
                    data:2,
                    context: "someContext"
                });
                done();
            });

            context.foo.onNext({
                data:1,
                context: "someContext"
            });
        });

        it(", as the properties, should be reactivated if given a new value", function(done){
            var actual = [];
            setupComputedProperties.call(context);
            subscription = context.bar.subscribe(function(x){
                actual.push(x);
                if(actual.length === 2) {
                    expect(actual).deep.equal([{
                        data:2,
                        context: "someContext"
                    },{
                        data:3,
                        context: "someContext2"
                    }]);
                    done();
                }
            });

            context.foo.onNext({
                data:1,
                context: "someContext"
            });
            context.foo.onNext({
                data:2,
                context: "someContext2"
            });
        });

        it(", as the properties, should be reactivated if given a new value even with async operations", function(done){
            var actual = [];
            setupComputedProperties.call(context);
            subscription = context.bar2.subscribe(function(x){
                actual.push(x);
                if(actual.length === 2) {
                    expect(actual).deep.equal([{
                        data:2,
                        context: "someContext"
                    },{
                        data:3,
                        context: "someContext2"
                    }]);
                    done();
                }
            });

            context.foo.onNext({
                data:1,
                context: "someContext"
            });
            context.foo.onNext({
                data:2,
                context: "someContext2"
            });
        });

        it(", as the properties, should reactivate when multiple properties are invloved", function(done){
            var actual = [];
            setupComputedProperties.call(context);
            subscription = context.bar3.subscribe(function(x){
                actual.push(x);
                if(actual.length === 2) {
                    expect(actual).deep.equal([{
                        data:3,
                        context: "someContext"
                    },{
                        data:11,
                        context: "someContext2"
                    }]);
                    done();
                }
            });

            context.foo.onNext({
                data:1,
                context: "someContext"
            });
            context.foo2.onNext({
                data:2,
                context: "someContext"
            });

            context.foo.onNext({
                data:5,
                context: "someContext2"
            });
            context.foo2.onNext({
                data:6,
                context: "someContext2"
            });
        });
    });
});
