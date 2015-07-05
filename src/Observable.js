import {Observable, Scheduler, helpers} from "rx";

/**
 * The value can be an observable, iterable, primitive value, null or undefined
 * If it is an observable, collect all the observing sequence and convert it to an iterable then do iterable
 * If it is a primitive value or null, stringify it
 * If it is an undefined, stop propagation
 */
Observable.prototype.push = function() {
    return this.filter(x=>x!==undefined).flatMap(x=>x).map(x=> JSON.stringify(x));
};

Observable.prototype.pipeOut = function() {
    return this.map(JSON.parse).map(x=>Array.isArray(x)? Observable.from(x, x=>x, this, Scheduler.immediate): x);
};

Observable.prototype.flattenIterable = function() {
    let [iterable, nonIterable] =  this.partition(helpers.isIterable);
    return Observable.merge(iterable.flatMap(x=>x), nonIterable);
    return this;
};

Observable.isObservable = function(obj) {
    return !!(obj && obj.subscribe);
};

export default Observable;