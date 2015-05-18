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
    });

    describe("scatter & gather & collect & distribute", function(){

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

            it(", as this property, can interact with other properties with async operations by zip", function(done){
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

            it(", as this property, can interact with multiple properties with async operations by zip", function(done){
                var source1 = Rx.Observable.return([[1,2,3],[1,2,3]]).distribute().scatter().asyncMap(function(x){
                    return RSVP.resolve(x);
                }).asyncMap(function(x){
                    return RSVP.resolve(x+1);
                });
                var source2 = Rx.Observable.return([[9,8,7],[9,8,7]]).distribute().scatter().asyncMap(function(x){
                    return RSVP.resolve(x);
                });
                var source3 = Rx.Observable.return([[3,4,5],[5,4,3]]).distribute().scatter().asyncMap(function(x){
                    return RSVP.resolve(x);
                });

                subscription = Observable.zip(
                    source1, source2, source3,
                    function(x,y,z){
                        return x+y+z;
                    }
                ).gather().collect().subscribe(function(x){
                    expect(x).deep.equal([[14, 15, 16], [16, 15, 14]]);
                    done();
                });
            });

            it(", as this property, can be distributed, scattered while only collected in the end", function(done){
                var source = Rx.Observable.return([[1,2,3],[1,2,3]]).distribute().scatter().asyncMap(function(x){
                    return RSVP.resolve(x);
                }).asyncMap(function(x){
                    return RSVP.resolve(x+1);
                });

                subscription = source.collect().subscribe(function(x){
                    expect(x).deep.equal([2,3,4,2,3,4]);
                    done();
                });
            });

            it(", as this property, can interact with other properties with async operations by combineLatest", function(done){
                var source1 = Rx.Observable.return([[1,2,3],[1,2,3]]).distribute().scatter().asyncMap(function(x){
                    return RSVP.resolve(x);
                }).asyncMap(function(x){
                    return RSVP.resolve(x+1);
                });
                var source2 = Rx.Observable.return([1]).scatter();

                subscription = Observable.combineLatest(
                    source1, source2,
                    function(x,y){
                        return x+y;
                    }
                ).gather().collect().subscribe(function(x){
                    expect(x).deep.equal([[3, 4, 5], [3, 4, 5]]);
                    done();
                });
            });
        });
    });
});