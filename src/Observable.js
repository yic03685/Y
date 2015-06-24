import {Observable, Scheduler, helpers} from "rx";

Observable.prototype.pipeIn = function() {
    return this.flatMap(x=>x).map(x=>x.length===1?x[0]:x).map(JSON.stringify);
};

Observable.prototype.pipeOut = function() {
    return this.map(JSON.parse).map(x=>Array.isArray(x)? Observable.from(x): Observable.return(x));
};

Observable.prototype.flattenIterable = function() {
    let [iterable, nonIterable] =  this.partition(helpers.isIterable);
    return Observable.merge(iterable.flatMap(x=>x), nonIterable);
};

Observable.isObservable = function(obj) {
    return !!obj.subscribe;
};

export default Observable;