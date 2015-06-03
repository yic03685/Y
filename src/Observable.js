import {Observable, Scheduler} from "rx";

Observable.isObservable = function(obj) {
    return !!obj.scheduler;
};

export default Observable;