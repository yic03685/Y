import bootstrap from "./bootstap";
import Observable from "./Observable";
import {ReplaySubject} from "rx";
import WallClock from "./WallClock";
import {pick} from "lodash";

class Model {

    constructor(name, stateTmpl, propertyTmpl, imports) {
        //TODO: Check if both name and template are valid
        this.name = name;
        this.stateTmpl = stateTmpl;
        this.propertyTmpl = propertyTmpl;
        this.imports = imports;
        this.document = {};
        this.output = {};
        this.setupProperties(this.setupStates());
    }

    // There are two kinds of inputs
    // 1. Self owned properties
    setupStates() {
        let self = this;
        let states = {};
        self.stateTmpl(states);
        Object.keys(states).forEach(function(key) {
            self.output[key] = new ReplaySubject();
            Object.defineProperty(self, key, {
                get: ()=> self.output[key].map(self.onPropertyChanged),
                set: (val) => self.changeState(key, val)
            });
            self[key] = states[key];
        });
        return states;
    }

    // 2. Properties derived from other models
    setupProperties(states) {
        let self = this;
        let stateKeys = Object.keys(states);
        let stateKeySet = new Set(stateKeys);
        let properties = Object.assign({}, pick.apply(null, [self].concat(stateKeys)));
        self.propertyTmpl(properties, self.imports);

        Object.keys(properties).filter(x=>!stateKeySet.has(x)).forEach(function(key) {
            var ob = properties[key];
            Object.defineProperty(self, key, {
                get: ()=> ob.map(self.onPropertyChanged)
            });
        });
    }

    changeState(key, value) {
        this.document[key] = value;
        this.output[key].onNext(value);
    }

    onPropertyChanged(value) {
        WallClock.pStart();
        WallClock.dStart();
        setImmediate(()=>{
            WallClock.dEnd();
            WallClock.pEnd();
        });
        return value;
    }
}

export default Model;