var Y = require("../build/y");
var Observable = Y.Observable;
var Rx = require("rx");
var WallClock = require("../build/WallClock");
var RSVP = require("rsvp");

describe("Observable", function(){

    describe("ayncMap", function(){

        var subscription;
        afterEach(function(){
            if(subscription){
                if(Array.isArray(subscription)){
                    subscription.forEach(function(x){
                        x.dispose();
                    })
                } else {
                    subscription.dispose();
                }
            }
        });

//        it("should be able to map an async property", function(done){
//            subscription = Observable.return([[1]]).distribute().scatter().asyncMap(function(x){
//                return RSVP.resolve(x);
//            }).gather().collect().subscribe(function(x){
//                console.log(x);
//                expect(x).equal(1);
//                done();
//            });
//        });
//
//        it("should be able to map an array of promises", function(done){
//            subscription = Observable.fromArray([1,2,3]).asyncMap(function(x){
//                return RSVP.resolve(x);
//            }).collect().subscribe(function(x){
//                expect(x).deep.equal([1,2,3]);
//                done();
//            });
//            WallClock.next();
//        });
//
//        it("should be able to map an array of promises multiple times", function(){
//            subscription = Observable.fromArray([1,2,3]).asyncMap(function(x){
//                return RSVP.resolve(x);
//            }).map(function(x){
//                return x+1;
//            }).asyncMap(function(x){
//                return RSVP.resolve(x);
//            }).subscribe(function(x){
//                expect(x).equal([2,3,4]);
//                done();
//            });
//            WallClock.next();
//        });
//
//        it("should be able to map many arrays of promises", function(done){
//            var ob1 = Observable.fromArray([1,2,3]).asyncMap(function(x){
//                return RSVP.resolve(x);
//            }).map(function(x){
//                return x+1;
//            }).asyncMap(function(x){
//                return RSVP.resolve(x);
//            });
//
//            WallClock.next();
//
//            var ob2 = Observable.fromArray([6,7]).asyncMap(function(x){
//                return RSVP.resolve(x);
//            }).map(function(x){
//                return x+1;
//            }).asyncMap(function(x){
//                return RSVP.resolve(x);
//            });
//
//            WallClock.next();
//
//            var actual = [];
//            subscription = Observable.merge(
//                ob1.collect(), ob2.collect()
//            ).subscribe(function(x){
//                actual.push(x);
//                if(actual.length===2) {
//                    expect(actual.sort(function(xs,ys){
//                        return ys.length - xs.length;
//                    })).deep.equal([
//                        [2,3,4],[7,8]
//                    ]);
//                    done();
//                }
//            });
//        });

//        it("should be able to map many arrays of promises with different contexts", function(done){
//            var ob1 = Observable.fromArray([1,2,3]).asyncMap(function(x){
//                return RSVP.resolve(x);
//            }).map(function(x){
//                return x+1;
//            }).asyncMap(function(x){
//                return RSVP.resolve(x);
//            });
//
//            WallClock.next("context1");
//
//            var ob2 = Observable.fromArray([6,7]).asyncMap(function(x){
//                return RSVP.resolve(x);
//            }).map(function(x){
//                return x+1;
//            }).asyncMap(function(x){
//                return RSVP.resolve(x);
//            });
//
//            WallClock.next("context2");
//
////            var sub1 = ob1.buffer(WallClock.tick).collect().subscribe()
//
//
//        });
    });

    describe("scatter & gather", function(){

        describe("when only one document", function(){

            var subscription;
            afterEach(function(){
                subscription = Array.isArray(subscription) ? subscription : [subscription];
                subscription.forEach(cancel);

                function cancel(subscription) {
                    if(subscription.dispose) {
                        subscription.dispose();
                    }
                }
            });

            it("should scatter an property", function(done){
                var actual = [];
                subscription = Rx.Observable.return([1,2,3]).scatter().subscribe(function(x){
                    actual.push(x);
                    if(actual.length === 3) {
                        expect(actual).deep.equal([1,2,3]);
                        done();
                    }
                });
            });

            it(", as this property, can be gathered back", function(done){
                subscription = Rx.Observable.return([1,2,3]).scatter().gather().subscribe(function(actual){
                    expect(actual).deep.equal([1,2,3]);
                    done();
                });
            });

            it(", as this property, can be chained with some sync operations then be gathered back", function(done){
                subscription = Rx.Observable.return([1,2,3]).scatter()
                    .map(function(x){return x+1})
                    .filter(function(x){return x>2})
                    .gather().subscribe(function(actual){
                        expect(actual).deep.equal([3,4]);
                        done();
                    });
            });

            it(", as this property, can be chained with some async operations then be gathered back", function(done){
                subscription = Rx.Observable.return([[1,2,3]]).distribute().scatter()
                    .asyncMap(function(x){return RSVP.resolve(x+1)})
                    .filter(function(x){return x>2})
                    .gather().subscribe(function(actual){
                        expect(actual).deep.equal([3,4]);
                        done();
                    });
            });

            it(", as this property, can interact with other properties", function(done){
                var source1 = Rx.Observable.return([1,2,3]).scatter();
                var source2 = Rx.Observable.return([9,8,7]).scatter();

                subscription = Observable.zip(
                    source1,
                    source2,
                    function(x,y){
                        return x+y;
                    }
                ).gather().subscribe(function(x){
                        expect(x).deep.equal([10,10,10]);
                        done();
                    });
            });

            it(", as this property, can interact with other properties with async operations", function(done){
                var source1 = Rx.Observable.return([[1,2,3]]).distribute().scatter().asyncMap(function(x){
                    return RSVP.resolve(x);
                });
                var source2 = Rx.Observable.return([[9,8,7]]).distribute().scatter().map(function(x) {
                    return x;
                });

                subscription = Observable.zip(
                    source1,
                    source2,
                    function(x,y){
                        return x+y;
                    }
                ).gather().subscribe(function(x){
                        expect(x).deep.equal([10,10,10]);
                        done();
                    });
            });
        });

        describe("when multiple documents", function() {

            var subscription;
            afterEach(function () {
                subscription = Array.isArray(subscription) ? subscription : [subscription];
                subscription.forEach(cancel);

                function cancel (subscription) {
                    if (subscription && subscription.dispose) {
                        subscription.dispose();
                    }
                }
            });

            it("should scatter an property", function(done){
                var actual = [];
                subscription = Rx.Observable.return([1,2,3]).repeat(2).scatter().subscribe(function(x){
                    actual.push(x);
                    if(actual.length === 6) {
                        expect(actual).deep.equal([1,2,3,1,2,3]);
                        done();
                    }
                });
            });

            it(", as this property, can be gathered back", function(done){
                var actual = [];
                subscription = Rx.Observable.return([1,2,3]).repeat(2).scatter().gather().subscribe(function(x){
                    actual.push(x);
                    if(actual.length === 2) {
                        expect(actual).deep.equal([[1,2,3],[1,2,3]]);
                        done();
                    }
                });
            });

            it(", as this property, can be chained with some sync operations then be gathered back", function(done){
                var actual = [];
                subscription = Rx.Observable.return([1,2,3]).repeat(2).scatter()
                    .map(function(x){return x+1})
                    .filter(function(x){return x>2})
                    .gather().subscribe(function(x){
                        actual.push(x);
                        if(actual.length===2) {
                            expect(actual).deep.equal([[3,4],[3,4]]);
                            done();
                        }
                    });
            });

            it(", as this property, can be chained with some async operations then be gathered back", function(done){
                var actual = [];
                subscription = Rx.Observable.return([[1,2,3],[1,2,3]]).distribute().scatter()
                    .asyncMap(function(x){return RSVP.resolve(x+1)})
                    .filter(function(x){return x>2})
                    .gather().subscribe(function(x){
                        actual.push(x);
                        if(actual.length===2) {
                            expect(actual).deep.equal([[3,4],[3,4]]);
                            done();
                        }
                    });
            });

            it(", as this property, can interact with other properties", function(done){
                var source1 = Rx.Observable.return([1,2,3]).repeat(2).scatter();
                var source2 = Rx.Observable.return([9,8,7]).repeat(2).scatter();
                var actual = [];

                subscription = Observable.zip(
                    source1,
                    source2,
                    function(x,y){
                        return x+y;
                    }
                ).gather().subscribe(function(x){
                        actual.push(x);
                        if(actual.length===2) {
                            expect(actual).deep.equal([[10, 10, 10], [10, 10, 10]]);
                            done();
                        }
                    });
            });

            it(", as this property, can interact with other properties with async operations 1", function(done){
                var source1 = Rx.Observable.return([[1,2,3],[1,2,3]]).distribute().scatter().asyncMap(function(x){
                    return RSVP.resolve(x);
                }).asyncMap(function(x){
                    return RSVP.resolve(x+1);
                });
                var source2 = Rx.Observable.return([[9,8,7],[9,8,7]]).distribute().scatter().asyncMap(function(x){
                    return RSVP.resolve(x);
                });

                subscription = Observable.zip(
                    source1, source2,
                    function(x,y){
                        return x+y;
                    }
                ).gather().collect().subscribe(function(x){
                    expect(x).deep.equal([[11, 11, 11], [11, 11, 11]]);
                    done();
                });
            });
        });
    });
});