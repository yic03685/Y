import {Subject, ReplaySubject} from "rx";
import {pick, values, flatten, isFunction} from "lodash";
import bootstrap from "./bootstap";
import Observable from "./Observable";
import ModelMap from "./ModelMap";
import Capture from "./Capture";

class StatelessModel {

    constructor(name, computedProperties) {
        //TODO: Check if both name and template are valid
        this.name = name;
        this.computedProperties = computedProperties;
        this.setupComputedProperties();
    }

    setupComputedProperties () {
        let self = this;
        Object.keys(this.computedProperties).forEach(defineProperty);

        /**
         * Define the property with a key for this model
         * @param {string} propertyName
         */
        function defineProperty(propertyName) {
            Object.defineProperty(self, propertyName, {
                get: function() {
                    let computedProperty = self.computedProperties[propertyName];
                    let [compute, requires] = isFunction(computedProperty)? [computedProperty, []] : computedProperty;
                    return self.pipe(requires, compute);
                }
            });
        }
    }

    pipe(dependencyModelNames, template) {
        let dependencyModels = [this.name].concat(dependencyModelNames).map(x=>ModelMap.get(x));
        let depKeysList = this.captureDependencies(template, dependencyModels);
        let depObjs = depKeysList.map((keys,i)=>values(pick(dependencyModels[i],keys)));
        let observables = flatten(depObjs);

        return Observable.combineLatest.apply(this, observables.concat(function(){
            let observedValues = Array.from(arguments);
            return depKeysList.map(function(keys){
                return keys.reduce((o,k)=>{
                    o[k] = Observable.return(observedValues.shift(1));
                    return o;
                },{});
            });
        })).flatMap(function(models){
            return template.apply(null, models);
        });
    }

    captureDependencies(compute, dependencyModels) {
        var captures = dependencyModels
            .map(model => Object.keys(model.computedProperties))
            .map(propertyNames => new Capture(propertyNames));

        // start capturing
        compute.apply(null, captures);
        return captures.map(x=>x.capturedKeys);
    }

    changeProperty(key, value) {
        this.document[key] = value;
        this.output[key].onNext(value);
    }
}

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
            self.output[key] = new ReplaySubject();
            Object.defineProperty(self, key, {
                get: function(){
                    self[key] = self.properties[key];
                    return self.output[key]
                },
                set: (val) => self.changeProperty(key, val)
            });
        });
    }

    captureDependencies(compute, dependencyModels) {
        var captures = dependencyModels
            .map(model => Object.keys(model.properties).concat(Object.keys(model.computedProperties)))
            .map(propertyNames => new Capture(propertyNames));

        // start capturing
        compute.apply(null, captures);
        return captures.map(x=>x.capturedKeys);
    }
}

export default {StatelessModel, Model};