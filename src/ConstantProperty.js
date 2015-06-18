/**
 * Created by ychen on 6/16/15.
 */
import Rx           from "rx";
import Property     from "./Property";
import Observable   from "./Observable"

class ConstantProperty extends Property {

    constructor(name, constantValue) {
        super(name);
        this._observable = new Rx.BehaviorSubject();
        this._observable.onNext(this.wrapInObservable(constantValue));
    }

    get observable() {
        return this._observable;
    }
}

export default ConstantProperty;