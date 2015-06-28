import {BehaviorSubject}    from "rx";
import Property             from "./Property";
import Observable           from "./Observable";

class StateProperty extends Property {

    constructor(name, value) {
        super(name);
        this.currentValue = new BehaviorSubject();
        this.currentValue.onNext(JSON.stringify(value));
    }

    get observer() {
        return this.currentValue;
    }

    get observable() {
        return this.currentValue.distinctUntilChanged();
    }
}

export default StateProperty;