import {Observable, Scheduler, helpers} from "rx";

Observable.prototype.partitionValues = function() {
    let source = this;
    return Observable.create(function(observer){
        let [obs, values] = source.partition(Observable.isObservable);
        obs.subscribe(x=>x.map(x=>x).partitionValues().subscribe(x=>observer.onNext(x)));
        values.toArray().subscribe(x=>{
            observer.onNext(x);
        });
    });
};

Observable.prototype.flattenIterable = function() {
    let [iterable, nonIterable] =  this.partition(helpers.isIterable);
    return Observable.merge(iterable.flatMap(x=>x), nonIterable);
};

Observable.prototype.wrap = function() {
    return this.flatMap(x=>x.toArray());
};

Observable.isObservable = function(obj) {
    return !!obj.subscribe;
};

export default Observable;