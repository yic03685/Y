import Constant from "./Constant";
import {Observable, Scheduler} from "rx";
import WallClock from "./WallClock";
import RSVP from "rsvp";

//[[1,2],[3,4,5]] => ps [1,2] ~ [3,4,5] pe => ps ds 1 ~ 2 de ~ ds 3 ~ 4 ~ 5 de pe
// => ps [1,2] ~ [3,4,5] pe => [[1,2], [3,4,5]]

Observable.prototype.asyncMap = function(generator) {
    return this
        .gather()
        .collect()
        .flatMap(function(lss){
            return RSVP.all(lss.map(function(ls){
                return RSVP.all(ls.map(function(v){
                    return generator(v);
                }))
            }));
        })
        .distribute()
        .scatter();
};

/**
 * Gather items within unit d time
 * @returns {*}
 */
Observable.prototype.gather = function() {
    return this.buffer(WallClock.onNextTick(Constant.DOCUMENT_TIME_START),
        ()=>WallClock.onNextTick(Constant.DOCUMENT_TIME_END))
        .filter(ls=>!!ls.length);
};

/**
 * Scatter an iterable into many items and take length * d time
 * @returns {*}
 */
Observable.prototype.scatter = function() {
    let source = this;
    return Observable.create(function(observer){
        return source.subscribe(function(values){
                WallClock.dStart();
                values.forEach(x=>observer.onNext(x));
                WallClock.dEnd();
        });
    });
};

/**
 * Gather items within unit p time
 * @returns {*}
 */
Observable.prototype.collect = function() {
    return this.buffer(WallClock.onNextTick(Constant.PROPERTY_TIME_START),
        ()=>WallClock.onNextTick(Constant.PROPERTY_TIME_END))
        .filter(ls=>!!ls.length);
};

/**
 * Scatter an iterable into many items and take length * p time
 * @returns {*}
 */
Observable.prototype.distribute = function() {
    let source = this;
    return Observable.create(function(observer){
        return source.subscribe(function(values){
                WallClock.pStart();
                values.forEach(x=>observer.onNext(x));
                WallClock.pEnd();
        });
    });
};

Observable.isObservable = function(obj) {
    return !!obj.scheduler;
};

export default Observable;