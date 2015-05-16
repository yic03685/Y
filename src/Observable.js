import {Observable, Scheduler} from "rx";
import WallClock from "./WallClock";
import RSVP from "rsvp";

Observable.prototype.asyncMap = function(generator) {
    let context = WallClock.context;
    var ls = this.collect().flatMap(function(ls){
        var promises = ls.map(generator);
        return !isPromiseList(promises)? [promises] : RSVP.all(promises);
    });

    ls.first().subscribe(function(){
        WallClock.next(context);
    }, Scheduler.immediate);

    return ls.flatMap(function(x){
        return x;
    });

    function isPromiseList(ls) {
        return ls.reduce((b,x)=> b && !!x.then, true);
    }
};

/**
 * Gather items within unit d time
 * @returns {*}
 */
Observable.prototype.gather = function() {
    return this.buffer(WallClock.tick.filter(x=>x==="Document")).filter(ls=>!!ls.length);
};

/**
 * Scatter an iterable into many items and take length * d time
 * @returns {*}
 */
Observable.prototype.scatter = function() {
    let source = this;
    return Observable.create(function(observer){
        return source.subscribe(function(values){
            values.forEach(x=>observer.onNext(x));
            WallClock.next("Document");
        });
    });
};

/**
 * Gather items within unit p time
 * @returns {*}
 */
Observable.prototype.collect = function() {
    return this.buffer(WallClock.tick).filter(ls=>!!ls.length);
};

/**
 * Scatter an iterable into many items and take length * p time
 * @returns {*}
 */
Observable.prototype.distribute = function() {
    return this.buffer(WallClock.tick).filter(ls=>!!ls.length);
};

Observable.isObservable = function(obj) {
    return !!obj.scheduler;
};

export default Observable;