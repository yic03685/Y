import {set}            from "lodash";
import Observable       from "./Observable";
import Model            from "./Model";
import Collection       from "./Collection";
import ModelMap         from "./ModelMap";
import Action           from "./Action";
import Util             from "./Util"
import StateProperty    from "./StateProperty";
import ComputedProperty from "./ComputedProperty";
import ActionHandler    from "./ActionHandler";

Function.prototype.require = function() {
    return {
        generator: this,
        dependencies: Array.from(arguments),
        isComputed: true
    };
};

class Y {

    static createModel(template) {
        let modelName = template.name;
        let properties = Object.keys(template).filter(x=>x!=="actions"&&x!=="name").map(propName=>Y._getProperty(modelName, propName, template[propName]))
            .reduce((obj, prop)=>set(obj, prop.name, prop),{})[modelName];
//        let actions = Object.keys(template).filter(x=>x!=="actions").map(propName=>Y._getProperty(modelName, propName, template[propName]));
        var model = new Model(modelName, properties);
        ModelMap.add(modelName, model);
        return model;
    }

    static createCollection(template) {
        let modelName = template.name;
        let properties = Object.keys(template).filter(x=>x!=="actions"&&x!=="name").map(propName=>Y._getProperty(modelName, propName, template[propName]))
            .reduce((obj, prop)=>set(obj, prop.name, prop),{})[modelName];
        var collection = new Collection(modelName, properties);
        ModelMap.add(modelName, collection);
        return collection;
    }

    static actions(actionName) {
        return function(value){
            return Action.actionStart(actionName, value);
        }
    }

    static get(modelName) {
        return ModelMap.get(modelName);
    }

    static _getProperty(modelName, propName, propValue, actionName) {
        let propFullName = Util.composePropertyName(modelName, propName);
        return (typeof propValue === "object" && propValue.isComputed)? (actionName? new ActionHandler(propFullName, propValue.generator, propValue.dependencies)
            :new ComputedProperty(propFullName, propValue.generator, propValue.dependencies))
            :new StateProperty(propFullName, propValue);
    }

    static _getActions(actionsTemplate) {

    }
}

Object.defineProperty(Y, "Observable", {
   get: ()=> Observable
});

export default Y;