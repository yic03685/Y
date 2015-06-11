import Rx from "rx";
import {partition, isFunction, pick} from "lodash";
import Observable from "./Observable";
import StatelessModel from "./StatelessModel";
import Model from "./Model";
import ModelMap from "./ModelMap";

class Y {

    static createModel(template) {
        let properties = template.properties;
        let [computedPropertyKeys, statefulPropertyKeys] = partition(Object.keys(properties), (k)=>{
            return Array.isArray(properties[k]) || isFunction(properties[k]) || typeof properties[k] === "string";
        });
        let computedProperties = pick(properties, computedPropertyKeys);
        let statefulProperties = pick(properties, statefulPropertyKeys);
        let model = !statefulPropertyKeys.length? new StatelessModel(template.name, computedProperties): new Model(template.name, statefulProperties, computedProperties, template.actions);
        ModelMap.add(model.name, model);
        return model;
    }
}

Object.defineProperty(Y, "Observable", {
   get: ()=> Observable
});

export default Y;