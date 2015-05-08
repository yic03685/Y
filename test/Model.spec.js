var bootstrap = require("./bootstrap");
var Model = require("../build/Model");
var Observable = require("../build/Observable");
var Subject = require("rx").Subject;
var WallClock = require("../build/WallClock");

describe("Model", function(){


    describe("createDocuments", function(){

        var createDocuments, context, proxy;
        before(function(){
            context = {
                documents: []
            };
            proxy = {
                foo: 1,
                bar: Observable.return(1)
            };
            createDocuments = Model.prototype.createDocuments;
            WallClock.context = "setup";
        });

        it("should have only one document if the observable has only one value", function(){
            var observable = Observable.fromArray([1]);
            createDocuments.call(context, observable, proxy);

            expect(context.documents).deep.equal([{
                foo:1,
                bar:null
            }]);
        });

        it("should have only many document if the observable has multiple values", function(){
            var observable = Observable.fromArray([1,2,3]);
            createDocuments.call(context, observable, proxy);

            expect(context.documents).deep.equal([{
                foo:1,
                bar:null
            },{
                foo:1,
                bar:null
            },{
                foo:1,
                bar:null
            }]);
        });

        it("should have only many document if the observable has multiple values and they are async", function(){

        });
    });

    describe("onPropertyChanged", function() {

        var onPropertyChanged, context, subscription;
        before(function () {
            context = {
                documents: [],
                output: {
                    foo: new Subject(),
                    bar: new Subject()
                }
            };
            onPropertyChanged = Model.prototype.onPropertyChanged;
        });

        afterEach(function(){
           if(subscription && subscription.dispose){
               subscription.dispose();
           }
        });

        it("should propagate a value if it has only one document", function(done){
            context.documents = [{
                foo: 1,
                bar: null
            }];

            subscription = context.output["foo"].subscribe(function(v){
                expect(v).equal(2);
                expect(context.documents[0].foo).equal(2);
                done();
            });

            onPropertyChanged.call(context, "foo", 2);
        });

        it("should propagate values if it has multiple documents", function(done){
            context.documents = [{
                foo: 1,
                bar: null
            },{
                foo: 1,
                bar: null
            }];

            subscription = context.output["foo"].collect().subscribe(function(v){
                expect(v).deep.equal([2,2]);
                expect(context.documents.reduce(function(c,x){
                   return c.concat(x["foo"]);
                },[])).deep.equal([2,2]);
                done();
            });

            onPropertyChanged.call(context, "foo", 2);
        });
    });
});
