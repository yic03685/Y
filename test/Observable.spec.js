var Y = require("../build/y");
var Observable = Y.Observable;
var Rx = require("rx");
var Clock = require("../build/Clock");

describe("Observable", function(){

    describe("toArray", function(){

        describe("when opertations are all sync", function(){

            it("should collect all the items", function(){

//                Clock.next.subscribe(function(x){
//                    console.log(x);
//                });

                Observable.generate(0, function (x) { return x < 3; },
                    function (x) { return x + 1; },
                    function (x) { return x; }
                ).collect("test").subscribe(function(x){
                    console.log(x);
                });

                Clock.tick("tes");

//                var subject = new Rx.Subject();
//
//                Observable.generate(0, function (x) { return x < 3; },
//                    function (x) { return x + 1; },
//                    function (x) { return x; }
//                ).buffer(subject).subscribe(function(x){
//                        console.log(x);
//                    });


//                var openings = Rx.Observable.interval(200);
//
//                var source = Rx.Observable.interval(50)
//                    .buffer(openings, function (x) { return Rx.Observable.timer(x + 100); })
//                    .take(3);
//
//                var subscription = source.subscribe(
//                    function (x) {
//                        console.log('Next: %s', x);
//                    },
//                    function (err) {
//                        console.log('Error: %s', err);
//                    },
//                    function () {
//                        console.log('Completed');
//                    });

            });
        });


    });
});