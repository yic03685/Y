import {Subject} from "Rx";

class Clock {

    constructor() {
        this.tick = new Subject();
        this.context = null;
    }

//    next(context) {
//        this.context = context? context : this.context;
//        this.tick.onNext(this.context);
//    }

    next(type) {
        this.tick.onNext(type);
    }
}

export default new Clock();
