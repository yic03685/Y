var WallClock = require("../build/WallClock");
var Constant = require("../build/Constant");

describe("WallClock", function(){

    describe("document time", function(){

        var subscription;
        afterEach(function(){
            subscription = Array.isArray(subscription) ? subscription : [subscription];
            subscription.forEach(cancel);

            function cancel(subscription) {
                if(subscription.dispose) {
                    subscription.dispose();
                }
            }
            WallClock.clear();
        });

        it("can listen to only when document starts", function(done){
            var actual = [];
            subscription = WallClock.onNextTick(Constant.DOCUMENT_TIME_START).subscribe(function(x){
                actual.push(x);
                expect(actual).deep.equal([Constant.DOCUMENT_TIME_START]);
                done();
            });
            WallClock.dEnd();
            WallClock.dStart();
        });

        it("can listen to only when document ends", function(done){
            var actual = [];
            subscription = WallClock.onNextTick(Constant.DOCUMENT_TIME_END).subscribe(function(x){
                actual.push(x);
                expect(actual).deep.equal([Constant.DOCUMENT_TIME_END]);
                done();
            });
            WallClock.dEnd();
            WallClock.dStart();
            WallClock.dEnd();
        });

        it("won't issue multiple ends", function(done){
            var actual = [];
            subscription = WallClock.onNextTick().subscribe(function(x){
                actual.push(x);
                if(actual.length === 2) {
                    expect(actual).deep.equal([Constant.DOCUMENT_TIME_START,Constant.DOCUMENT_TIME_END]);
                    done();
                }
            });
            WallClock.dStart();
            WallClock.dEnd();
            WallClock.dEnd();
        });
    });

    describe("property time", function(){

        var subscription;
        afterEach(function(){
            subscription = Array.isArray(subscription) ? subscription : [subscription];
            subscription.forEach(cancel);

            function cancel(subscription) {
                if(subscription.dispose) {
                    subscription.dispose();
                }
            }
            WallClock.clear();
        });

        it("can listen to only when property starts", function(done){
            var actual = [];
            subscription = WallClock.onNextTick(Constant.PROPERTY_TIME_START).subscribe(function(x){
                actual.push(x);
                expect(actual).deep.equal([Constant.PROPERTY_TIME_START]);
                done();
            });
            WallClock.pStart();
        });

        it("should issue a start and a end", function(done){
            var actual = [];
            subscription = WallClock.onNextTick().subscribe(function(x){
                actual.push(x);
                if(actual.length === 2) {
                    expect(actual).deep.equal([Constant.PROPERTY_TIME_START, Constant.PROPERTY_TIME_END]);
                    done();
                }
            });
            WallClock.pStart();
            WallClock.pEnd();
        });

        it("should issue in order", function(done){
            var actual = [];
            subscription = WallClock.onNextTick().subscribe(function(x){
                actual.push(x);
                if(actual.length === 4) {
                    expect(actual).deep.equal([Constant.PROPERTY_TIME_START, Constant.DOCUMENT_TIME_START, Constant.DOCUMENT_TIME_END, Constant.PROPERTY_TIME_END]);
                    done();
                }
            });
            WallClock.pStart();
            WallClock.dStart();
            WallClock.dEnd();
            WallClock.pEnd();
        });

        it("should wait for a document is done", function(done){
            var actual = [];
            subscription = WallClock.onNextTick().subscribe(function(x){
                actual.push(x);
                if(actual.length === 4) {
                    expect(actual).deep.equal([Constant.PROPERTY_TIME_START, Constant.DOCUMENT_TIME_START, Constant.DOCUMENT_TIME_END, Constant.PROPERTY_TIME_END]);
                    done();
                }
            });
            WallClock.pStart();
            WallClock.pEnd();
            WallClock.dStart();
            WallClock.dEnd();
        });

        it("should wait for all documents are done", function(done){
            var actual = [];
            subscription = WallClock.onNextTick().subscribe(function(x){
                actual.push(x);
                if(actual.length === 6) {
                    expect(actual).deep.equal([Constant.PROPERTY_TIME_START, Constant.DOCUMENT_TIME_START, Constant.DOCUMENT_TIME_END, Constant.DOCUMENT_TIME_START, Constant.DOCUMENT_TIME_END, Constant.PROPERTY_TIME_END]);
                    done();
                }
            });
            WallClock.pStart();
            WallClock.pEnd();
            WallClock.dStart();
            WallClock.dEnd();
            WallClock.dStart();
            WallClock.dEnd();
        });
    });
});