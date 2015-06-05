import {Observable, Scheduler} from "rx";

Observable.prototype.partitionValues = function() {
    let source = this;
    return Observable.create(function(observer){
        let [obs, values] = source.partition(Observable.isObservable);
        values.subscribe(x=>observer.onNext(x));
        obs.subscribe(x=>x.map(x=>x).partitionValues().subscribe(x=>observer.onNext(x)));
    });
};

Observable.isObservable = function(obj) {
    return !!obj.subscribe;
};

export default Observable;