var bootstrap = require("./bootstrap");
var Model = require("../build/Model");
var Observable = require("../build/Observable");
var WallClock = require("../build/WallClock");
var RSVP = require("rsvp");
var Rx = require('rx');

function isObservable(obj){
    return !!(obj && obj.subscribe);
}

describe("Model", function(){

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
