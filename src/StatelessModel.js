import {Subject} from "rx";
import {pick, values, flatten, isFunction, memoize} from "lodash";
import bootstrap from "./bootstap";
import Observable from "./Observable";
import ModelMap from "./ModelMap";
import Capture from "./Capture";

class StatelessModel {

    constructor(name, computedProperties) {
        //TODO: Check if both name and template are valid
        this.name = name;
        this.document = this.document? this.document : {};
        this.properties = this.properties? this.properties : {};
        this.computedProperties = computedProperties || {};
        this.setupComputedProperties();
        this.parents = this.findParents();
        this.setupActionProxy();
    }

    setupComputedProperties () {
        let self = this;
        let getObservable = memoize(function(name) {
            let [compute, requires] = getObservableProperty(name);
            return self.pipe(self.getDependencyObjects(requires, compute), compute, name).do(value => self.document[name] = value);
        });
        Object.keys(this.computedProperties).forEach(defineProperty);

        /**
         * Define the property with a key for this model
         * @param {string} propertyName
         */
        function defineProperty(propertyName) {
            Object.defineProperty(self, propertyName, {
                get: function() {
                    return getObservable(propertyName);
                }
            });
        }

        function getObservableProperty(propertyName) {
            let computedProperty = self.computedProperties[propertyName];
            return typeof computedProperty === "string"? getObservableProperty(computedProperty) : (isFunction(computedProperty)? [computedProperty, []] : computedProperty);
        }
    }

    /**
     * Get the properties that needed from the template
     * @param {[string]} dependencyModelNames
     * @param {function} template
     * @returns {[{name:Observable]}
     */
    getDependencyObjects(dependencyModelNames, template) {
        let dependencyModels = [this.name].concat(dependencyModelNames).map(x=>ModelMap.get(x));
        let depKeysList = this.captureDependencies(template, dependencyModels);
        return depKeysList.map((keys,i)=>keys.reduce((o,k)=>{
            o[k] = dependencyModels[i][k];
            return o;
        }, {}));
    }

    /**
     * Pipe the observable needed from dependencies
     * @param {[{name:Observable]} dependencyObjects
     * @param {function} template
     * @param {string} propertyName
     * @returns {Observable}
     */
    pipe(dependencyObjects, template, propertyName) {
        let observables = flatten(dependencyObjects.map(x=>values(x)));
        let depKeysList = dependencyObjects.map(x=>Object.keys(x));

        return Observable.combineLatest.apply(this, observables.concat(function(){
            let observedValues = Array.from(arguments);
            return depKeysList.map(function(keys){
                return keys.reduce((o,k)=>{
                    o[k] = Observable.return(observedValues.shift(1));
                    return o;
                },{});
            });
        })).flatMap(function(models){
            var res = template.apply(null, models);
            return Observable.isObservable(res)? res : res[propertyName];
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

    findParents() {
        return values(this.computedProperties)
            .filter(x=>Array.isArray(x))
            .reduce((o,x)=>o.concat(x[1]),[]) || [];
    }

    setupActionProxy() {
        let self = this;
        this.action = function(actionType) {
            return function(param) {
                self.relayAction(actionType, param);
            };
        };
    }

    relayAction(actionType, param) {
        this.parents.map(x=>ModelMap.get(x)).forEach(x=>x.relayAction(actionType, param));
    }
}

export default StatelessModel;