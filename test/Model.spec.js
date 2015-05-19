var bootstrap = require("./bootstrap");
var Model = require("../build/Model");
var Observable = require("../build/Observable");
var WallClock = require("../build/WallClock");
var RSVP = require("rsvp");

function isObservable(obj){
    return !!(obj && obj.subscribe);
}

describe("Model", function(){

    it("should work", function(done){

        var model = new Model("TestModel", function(model){
            model.foo = 1;
        }, function(model){
            model.bar = model.foo.map(function(x){
                return x+1;
            });
        });


//        model.bar.subscribe(function(x){
//            console.log(x);
////            done();
//        });

        model.bar.asyncMap(function(x){
            return RSVP.resolve(x+1);
        }).subscribe(function(x){
                console.log(x);
//            done();
        });

//        model.bar.asyncMap(function(x){
//           return RSVP.resolve(x+1);
//        }).subscribe(function(x){
//            console.log(x);
//        });

    });

    describe("setupStates", function(){

        var setupStates, context, subscription;
        beforeEach(function(){
            context = {
                stateTmpl : function(model) {
                    model.foo = 1;
                },
                output: {},
                onPropertyChanged : function(key, value) {
                    return ""+key+value;
                }
            };
            setupStates = Model.prototype.setupStates;
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
            setupStates.call(context);
            expect(isObservable(context.foo)).equal(true);
        });

        it(", as the getters and setters, should have initial values", function(done){
            setupStates.call(context);
            subscription = context.foo.subscribe(function(x){
                expect(x).equal(1);
                done();
            });
        });
    });
});
