import Rx from "rx";
import {partition, isFunction, pick} from "lodash";
import Observable from "./Observable";
import StatelessModel from "./StatelessModel";
import StatelessCollection from "./StatelessCollection";
import Model from "./Model";
import Collection from "./Collection";

import ModelMap from "./ModelMap";

Function.prototype.require = function(defaultState) {
    return {
        compute: this,
        dependencies: Array.prototype.slice.call(arguments),
        state: this.state,
        defaultState: defaultState
    };
};

Function.prototype.state = function(defaultState) {
    return {
        compute: this,
        require: this.require.bind(this, defaultState),
        defaultState: defaultState
    };
};

function scanProperties(template) {
    let properties = template.properties;
    let [computedPropertyKeys, constantPropertyKeys] = partition(Object.keys(properties), (k)=>{
        let v = properties[k];
        return (typeof v === "object" && !!v["compute"]) || typeof v === "string";
    });
    let [statefulComputedPropertyKeys, statelessComputedPropertyKeys] = partition(computedPropertyKeys, (k)=>{
        let v = properties[k];
        return v["defaultState"] !== undefined;
    });

    let constantProperties = pick(properties, constantPropertyKeys);
    let stateProperties = pick(properties, statefulComputedPropertyKeys);
    let computedProperties = pick(properties, statelessComputedPropertyKeys);
    return {constantProperties, stateProperties, computedProperties};
}

class Y {

    static createModel(template) {
        let {constantProperties, stateProperties, computedProperties} = scanProperties(template);
        let model = !constantProperties.length? new StatelessModel(template.name, stateProperties, computedProperties): new Model(template.name, constantProperties, stateProperties, computedProperties, template.actions);
        ModelMap.add(model.name, model);
        return model;
    }

    static createCollection(template) {
        let {constantProperties, stateProperties, computedProperties} = scanProperties(template);
        let collection = !constantProperties.length? new StatelessCollection(template.name, stateProperties, computedProperties): new Collection(template.name, constantProperties, stateProperties, computedProperties, template.actions);
        ModelMap.add(collection.name, collection);
        return collection;
    }
}

Object.defineProperty(Y, "Observable", {
   get: ()=> Observable
});

export default Y;