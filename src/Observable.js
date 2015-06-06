import {Observable, Scheduler} from "rx";

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

Observable.isObservable = function(obj) {
    return !!obj.subscribe;
};

export default Observable;