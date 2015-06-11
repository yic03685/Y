import Rx from "rx";
import {partition, isFunction, pick} from "lodash";
import Observable from "./Observable";
import StatelessModel from "./StatelessModel";
import StatelessCollection from "./StatelessCollection";
import Model from "./Model";
import Collection from "./Collection";

import ModelMap from "./ModelMap";

Function.prototype.require = function() {
    return {
        compute: this,
        dependencies: Array.prototype.slice.call(arguments)
    };
};

function scanProperties(template) {
    let properties = template.properties;
    let [computedPropertyKeys, statefulPropertyKeys] = partition(Object.keys(properties), (k)=>{
        let v = properties[k];
        return (typeof v === "object" && !!v["compute"]) || typeof v === "string";
    });
    let computedProperties = pick(properties, computedPropertyKeys);
    let statefulProperties = pick(properties, statefulPropertyKeys);
    return {statefulPropertyKeys, computedProperties, statefulProperties};
}

class Y {

    static createModel(template) {
        let {statefulPropertyKeys, computedProperties, statefulProperties} = scanProperties(template);
        let model = !statefulPropertyKeys.length? new StatelessModel(template.name, computedProperties): new Model(template.name, statefulProperties, computedProperties, template.actions);
        ModelMap.add(model.name, model);
        return model;
    }

    static createCollection(template) {
        let {statefulPropertyKeys, computedProperties, statefulProperties} = scanProperties(template);
        let collection = !statefulPropertyKeys.length? new StatelessCollection(template.name, computedProperties): new Collection(template.name, statefulProperties, computedProperties, template.actions);
        ModelMap.add(collection.name, collection);
        return collection;
    }
}

Object.defineProperty(Y, "Observable", {
   get: ()=> Observable
});

export default Y;