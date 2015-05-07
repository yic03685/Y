import {Subject} from "Rx";

class Clock {

    constructor() {
        this.next = new Subject();
        Object.freeze(this);

    }

    tick(context) {
        this.next.onNext(context);
    }
}

export default new Clock();
