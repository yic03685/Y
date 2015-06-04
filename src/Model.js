import StatelessModel from "./StatelessModel";
import {Subject, BehaviorSubject} from "rx";
import Capture from "./Capture";

class Model extends StatelessModel {

    constructor(name, properties, computedProperties, actions) {
        this.properties = properties;
        this.document = {};
        this.output = {};
        this.actions = actions;
        this.setupProperties();
        super(name, computedProperties);
    }

    setupProperties() {
        let self = this;
        Object.keys(this.properties).forEach(function(key) {
            self.output[key] = new BehaviorSubject();
            Object.defineProperty(self, key, {
                get: function(){
                    return self.output[key]
                },
                set: (val) => self.changeProperty(key, val)
            });
            self[key] = self.properties[key];
        });
    }

    changeProperty(key, value) {
        this.document[key] = value;
        this.output[key].onNext(value);
    }
}

export default Model;