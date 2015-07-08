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
        Object.keys(Observable.prototype).filter(x=>x!=="timestamp").forEach(m=>{
            Object.defineProperty(this, m, {
                get: function() {
                    return function(v) {
                        self.methods.push([m,v]);
                        return self;
                    }
                }
            })
        })
    }

    timestamp() {
        this.withTimestamp = true;
        return this;
    }

}

export default ComputedPropertyHelper;