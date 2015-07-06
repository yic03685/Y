/**
 * Created by yi on 2015/7/5.
 */
import Observable from "./Observable";

class ComputedPropertyHelper {

    constructor(generator, dependencies=[]) {
        this.generator = generator;
        this.dependencies = dependencies;
        this.methods = [];
        this.withTimestamp = false;
        this.isComputed = true;
        this.inheritObservableProto();
    }

    inheritObservableProto () {
        let self = this;
        Object.keys(Observable.prototype).forEach(m=>{
            Object.defineProperty(this, m, {
                get: function() {
                    return function() {
                        self.methods.push(m);
                        return self;
                    }
                }
            })
        })
    }

    timestamp() {
        this.withTimestamp = true;
    }

}

export default ComputedPropertyHelper;