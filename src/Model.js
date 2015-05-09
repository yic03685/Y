import Observable from "./Observable";
import {Subject} from "rx";
import WallClock from "./WallClock";

class Model {

    constructor(name, stateTmpl, propertyTmpl, imports) {
        //TODO: Check if both name and template are valid
        this.name = name;
        this.stateTmpl = stateTmpl;
        this.propertyTmpl = propertyTmpl;
        this.imports = imports;
        this.documents = [];
        this.store = [];
        this.output = {};

        setupProperties(setupStates());
    }

    // There are two kinds of inputs
    // 1. Self owned properties
    setupStates() {
        let self = this;
        let states = {};
        self.stateTmpl(states);

        Object.keys(states).forEach(function(key) {
            self.output[key] = new Subject();
            Object.defineProperty(self, key, {
                get: ()=> self.output[key],
                set: (val) => self.onPropertyChanged(key, val)
            });
        });

        return states;
    }

    // 2. Properties derived from other models
    setupProperties(states) {
        let self = this;
        let properties = {};
        let keyOb = self.propertyTmpl(properties, self.imports);

        self.createDocuments(keyOb, Object.assign({}, states, properties));

        Object.keys(properties).forEach(function(key) {
            var ob = properties[key];
            ob.subscribe(function(val){
                self.onPropertyChanged(key, val);
            });
            self.output[key] = new Subject();
            Object.defineProperty(self, key, {
                get: ()=> self.output[key]
            });
        });

    }

    createDocuments(ob, proxy) {
        var self = this;
        var template = Object.keys(proxy).reduce((obj,k)=>{
            obj[k] = Observable.isObservable(proxy[k])? null : proxy[k];
            return obj;
        },{});
        ob.collect().subscribe(function(ls){
            self.documents = ls.map(x=>template);
        });
        WallClock.next();
    }

    onPropertyChanged(key, value) {
        var self = this;
        //TODO: filter or other operations to get a subset of the documents
        this.documents.forEach(function(document){
            document[key] = value;
            self.output[key].onNext(value);
        });
        WallClock.next();
    }
}

export default Model;