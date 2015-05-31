import {Subject, ReplaySubject} from "rx";
import bootstrap from "./bootstap";
import {pick, values, flatten, isFunction} from "lodash";
import Observable from "./Observable";
import ModelMap from "./ModelMap";

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

class Model {

    constructor(name, properties, computedProperties) {
        //TODO: Check if both name and template are valid
        this.name = name;
        this.properties = properties;
        this.computedProperties = computedProperties;
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
        // for each computed property
        Object.keys(this.computedProperties).forEach(defineProperty);

        function captureDependencies(compute, dependencyModels) {
            var captures = dependencyModels
                .map(model => Object.keys(model.properties).concat(Object.keys(model.computedProperties)))
                .map(propertyNames => new Capture(propertyNames));

            // start capturing
            compute.apply(null, captures);
            return captures.map(x=>x.capturedKeys);
        }

        /**
         * Define the property with a key for this model
         * @param {string} propertyName
         */
        function defineProperty(propertyName) {
            Object.defineProperty(self, propertyName, {
                get: function() {
                    let computedProperty = self.computedProperties[propertyName];
                    let [compute, requires] = isFunction(computedProperty)? [computedProperty, []] : computedProperty;
                    let dependencyModels = [self.name].concat(requires).map(x=>ModelMap.get(x));
                    let depKeysList = captureDependencies(compute, dependencyModels);
                    let depObjs = depKeysList.map((keys,i)=>values(pick(dependencyModels[i],keys)));
                    let observables = flatten(depObjs);

                    return Observable.combineLatest.apply(self, observables.concat(function(){
                        let observedValues = Array.from(arguments);
                        return depKeysList.map(function(keys){
                            return keys.reduce((o,k)=>{
                                o[k] = Observable.return(observedValues.shift(1));
                                return o;
                            },{});
                        });
                    })).flatMap(function(models){
                        return compute.apply(null, models);
                    });
                }
            });
        }
    }

    changeProperty(key, value) {
        this.document[key] = value;
        this.output[key].onNext(value);
    }
}

export default Model;