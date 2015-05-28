import bootstrap from "./bootstap";
import {pick} from "lodash";
import Observable from "./Observable";
import {ReplaySubject} from "rx";

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
    setupComputedProperties () {
        let self = this;
        let propertiesSet = new Set(Object.keys(this.properties));
        let properties = Object.keys(this.properties)
            .filter(x=>propertiesSet.has(x))
            .reduce((obj, k)=> {
                obj[k] = self[k];
                return obj;
            }, {});

        // for each computed property
        Object.keys(this.computedProperties).forEach(function (key) {
            let capture = {};
            let capturedPropertyKeys = [];

            // find out the dependencies for each computed property within this model (self)
            Object.keys(properties).map(function (k) {
                Object.defineProperty(capture, k, {
                    get: function () {
                        capturedPropertyKeys.push(k);
                        return new ReplaySubject();
                    }
                });
            });
            // start capturing
            self.computedProperties[key](capture);

            // setup the computed property in the model
            Object.defineProperty(self, key, {
                get: function() {
                    return Observable.combineLatest.apply(self, capturedPropertyKeys.map(k=>self[k]).concat(function(){
                        return capturedPropertyKeys.reduce((o,k,i) => {
                            o[k] = Observable.return(arguments[i]);
                            return o;
                        },{});
                    })).flatMap(function(model){
                        return self.computedProperties[key](model);
                    });
                }
            });

            // find out the dependencies for each computed property other than this model
        });
    }

    changeProperty(key, value) {
        this.document[key] = value;
        this.output[key].onNext(value);
    }
}

export default Model;