import {Observable, Scheduler} from "rx";

Observable.isObservable = function(obj) {
    return !!obj.subscribe;
};

export default Observable;