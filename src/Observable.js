import {Observable, Scheduler, helpers} from "rx";

Observable.prototype.innerChain = function(methods) {
    return this.flatMap(input=>{
        let isArray = Array.isArray(input);
        let s = isArray? Observable.from(input, x=>x, Scheduler.immediate): Observable.return(input);


        // x => x => [x] => x
        // [x] => x => [x] => x
        // [x,y] => x|y => [x,y] => [x,y]
        // [[x]] => [x] => [[x]] => [x]

        return apply(s, methods).toArray().map(x=>{
            return isArray? x: x[0];
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