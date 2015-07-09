import {Observable, Scheduler, helpers} from "rx";

Observable.prototype.innerChain = function(methods) {
    return this.flatMap(x=>{
        let s = Array.isArray(x)? Observable.from(x, x=>x, Scheduler.immediate): Observable.return(x);
        return apply(s, methods).toArray().map(x=>{
            return Array.isArray(x) && x.length===1 && Array.isArray(x[0])? x[0] : x;
        });
    });
    function apply(prev, methods) {
        if(!methods.length) {
            return prev;
        }
        let [methodName, methodParams] = methods[0];
        return apply(prev[methodName].apply(prev, methodParams), methods.slice(1));
    }
};

Observable.prototype.stringify = function() {
    return this.map(x=> JSON.stringify(x));
};

Observable.prototype.parse = function() {
    return this.map(x=> JSON.parse(x));
};

Observable.prototype.flattenIterable = function() {
    let [iterable, nonIterable] =  this.partition(helpers.isIterable);
    return Observable.merge(iterable.flatMap(x=>x), nonIterable);
    return this;
};

Observable.prototype.flatten = function() {
  return this.flatMap(x=>x);
};

Observable.isObservable = function(obj) {
    return !!(obj && obj.subscribe);
};

export default Observable;