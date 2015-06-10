/**
 * Created by ychen on 6/6/15.
 */
var Util = require("../build/Util");

describe("Util", function(){

    describe("parseDependencyString", function(){

        var testFunc;

        before(function(){
            testFunc = Util.parseDependencyString;
        });

        it("should get model name and property name is the format is valid", function(){
            expect(testFunc("MyModel.myProp")).deep.equal(["MyModel","myProp"]);
        });

        it("should give an error if the format is wrong (no property name)", function(){
            expect(testFunc("MyModel.")).deep.equal(["",""]);
        });

        it("should give an error if the format is wrong (no model name)", function(){
            expect(testFunc(".myProp")).deep.equal(["",""]);
        });
    });

});