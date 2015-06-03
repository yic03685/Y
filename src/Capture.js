/**
 * Created by ychen on 6/2/15.
 */
import {Subject} from "rx";

class Capture {
    constructor(keys) {
        this.capturedKeys = [];
        this.keys = keys;
        this.init();
        Object.freeze(this);
    }
    init() {
        let self = this;
        // set up the capture
        // find out the dependencies for each computed property within this model (self)
        this.keys.forEach(function (k) {
            Object.defineProperty(self, k, {
                get: function () {
                    self.capturedKeys.push(k);
                    return new Subject().first();
                }
            });
        });
    }
}

export default Capture;