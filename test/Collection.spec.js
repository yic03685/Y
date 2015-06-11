/**
 * Created by ychen on 6/11/15.
 */
var Rx = require("rx");
var bootstrap = require("./bootstrap");
var Model = require("../build/Model");
var CollectionMixin = require("../build/CollectionMixin");
var Observable = require("../build/Observable");
var RSVP = require("rsvp");
var ModelMap = require("../build/ModelMap");
var Y = require("../build/Y");
var Error = require("../build/Error");
var Constant = require("../build/Constant");

describe("StatelessCollection", function() {

    describe("experimentOnCollection", function(){

        var collection = Y.createCollection({
            name: "myCollection",
            properties: {
                foo: [1,2,3],
                x: [3,2,1],
                bar: function(foo,x){
                    return Observable.zip( foo, x, function(x,y){
                        return x+y;
                    });
                }.require("myCollection.foo", "myCollection.x")
            }
        });

        collection.observeAll().subscribe(function(x){
            console.log(x);
        });

    });

    describe("combineLatestToObject", function () {

        var context, testFunc;
        beforeEach(function(){
            testFunc =  CollectionMixin.combineLatestToObject;
            context = {
                myProp: new Rx.BehaviorSubject(),
                myProp2: new Rx.BehaviorSubject()
            };
        });

        it("should get the combined object for the keys specified if there's only one document", function(done){
            context.myProp.onNext([1]);
            context.myProp2.onNext([10]);

            testFunc.call(context, ["myProp","myProp2"]).subscribe(function(x){
                expect(x).deep.equal([{
                    myProp:1, myProp2: 10
                }]);
                done();
            });
        });

        it("should get the combined object for the keys specified if there are more than one documents", function(done){
            context.myProp.onNext([1,2,3]);
            context.myProp2.onNext([10,20,30]);

            testFunc.call(context, ["myProp","myProp2"]).subscribe(function(x){
                expect(x).deep.equal([{
                    myProp:1, myProp2: 10
                },{
                    myProp:2, myProp2: 20
                },{
                    myProp:3, myProp2: 30
                }]);
                done();
            });
        });
    });

    describe("submitChanges", function(){

        var context, testFunc;
        beforeEach(function(){
            testFunc =  CollectionMixin.submitChanges;
            context = {
                documents: [{foo:1,bar:2},{foo:3,bar:4}],
                properties: {
                    foo: {},
                    bar: {}
                },
                output: {
                    foo: {onNext:function(){}},
                    bar: {onNext:function(){}},
                }
            };
        });

        it("should change the values for some property if the number of documents doesn't change", function(){
            testFunc.call(context, [{foo:10,bar:3},{foo:30,bar:4}]);
            expect(context.documents).deep.equal([{foo:10,bar:3},{foo:30,bar:4}]);
        });

        it("should change the values for some property if the number increases", function(){
            testFunc.call(context, [{foo:10,bar:3},{foo:30,bar:4},{foo:20,bar:6}]);
            expect(context.documents).deep.equal([{foo:10,bar:3},{foo:30,bar:4},{foo:20,bar:6}]);
        });

        it("should change the values for some property if the number decreases", function(){
            testFunc.call(context, [{foo:10,bar:3}]);
            expect(context.documents).deep.equal([{foo:10,bar:3}]);
        });

        it("won't make any change even changed the computed properties", function(){
            testFunc.call(context, [{foo:10,bar:3,x:1}, {foo:10,bar:3,x:2}]);
            expect(context.documents).deep.equal([{foo:10,bar:3},{foo:10,bar:3}]);
        });
    });
});