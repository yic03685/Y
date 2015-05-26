import bootstrap from "./bootstap";
import {pick} from "lodash";
import Observable from "./Observable";
import {ReplaySubject} from "rx";
import SessionController from "./SessionController";

class Model {

    constructor(name, properties, computedProperties, imports) {
        //TODO: Check if both name and template are valid
        this.name = name;
        this.properties = properties;
        this.computedProperties = computedProperties;
        this.imports = imports;
        this.document = {};
        this.output = {};
        this.setupProperties();
        this.setupComputedProperties();
    }

    // There are two kinds of inputs
    // 1. Self owned properties
    setupProperties() {
        let self = this;
        Object.keys(this.properties).forEach(function(key) {
            self.output[key] = new ReplaySubject();
            Object.defineProperty(self, key, {
                get: ()=> self.output[key],
                set: (val) => self.changeProperty(key, val)
            });
            self[key] = self.properties[key];
        });
    }

    // 2. Properties derived from other models
    setupComputedProperties() {
        let self = this;
        let propertiesSet = new Set(Object.keys(this.properties));
        let properties = Object.keys(this)
            .filter(x=>propertiesSet.has(x))
            .reduce((obj,k)=>{
                obj[k] = self[k];
                return obj;
            },{});

        Object.keys(this.computedProperties).forEach(function(key, i) {
            let proxy = {};
            // setup proxy
            SessionController.create(i);
            Object.keys(properties).map(function(k) {
                Object.defineProperty(proxy, k, {
                   get: function() {
                       var source = properties[k].controlled();
                       SessionController.get(i).addSource(source);
                       return source.sessionStart(i);
                   }
                });
            });
            Object.defineProperty(self, key, {
                get: function() {
                    var obs = self.computedProperties[key](proxy).sessionEnd(i);
                    SessionController.get(i).requestNext();
                    return obs;
                }
            });
        });
    }

    changeProperty(key, value) {
        this.document[key] = value;
        this.output[key].onNext(value);
    }
}

export default Model;