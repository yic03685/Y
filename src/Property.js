/**
 * Created by ychen on 6/16/15.
 */
import Observable   from "./Observable";

class Property {

    constructor(name) {
        this.name = name;
    }
    get observable() {}

    wrapInObservable(value) {
        return Array.isArray(value)? Observable.from(value) : Observable.return(value);
    }
}

export default Property;