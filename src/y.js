import {set}            from "lodash";
import bootstrap         from "./bootstrap"
import Observable       from "./Observable";
import Model            from "./Model";
import Collection       from "./Collection";
import ModelMap         from "./ModelMap";
import Action           from "./Action";
import Util             from "./Util"
import StateProperty    from "./StateProperty";
import ComputedProperty from "./ComputedProperty";
import ActionHandler    from "./ActionHandler";
import ComputedPropertyHelper from "./ComputedPropertyHelper";

Function.prototype.require = function() {
    return new ComputedPropertyHelper(this, Array.from(arguments));
};

class Y {

    static createModel(template) {
        let modelName = template.name;
        let properties = Object.keys(template).filter(x=>x!=="actions"&&x!=="name").map(propName=>Y._getProperty(modelName, propName, template[propName]))
            .reduce((obj, prop)=>set(obj, prop.name, prop),{})[modelName];
        let actions = Y._getActions(modelName, template.actions);
        var model = new Model(modelName, properties, actions);
        ModelMap.add(modelName, model);
        return model;
    }

    static createCollection(template) {
        let modelName = template.name;
        let properties = Object.keys(template).filter(x=>x!=="actions"&&x!=="name").map(propName=>Y._getProperty(modelName, propName, template[propName]))
            .reduce((obj, prop)=>set(obj, prop.name, prop),{})[modelName];
        let actions = Y._getActions(modelName, template.actions);
        var collection = new Collection(modelName, properties, actions);
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
        let value = typeof propValue === "function"? {generator: propValue, isComputed:true, dependencies:[]}: propValue;
        return ((typeof value === "object" && value.isComputed))?
            (actionName? new ActionHandler(propFullName, value.generator, value.dependencies, value.withTimestamp, value.methods)
            :new ComputedProperty(propFullName, value.generator, value.dependencies, value.withTimestamp, value.methods))
            :new StateProperty(propFullName, value);
    }

    /**
     * {
     *  myAction: {
     *      myProp: actionHandler
 *      }
     * }
     * @param modelName
     * @param actionsTemplate
     * @returns {Array|*}
     * @private
     */

    static _getActions(modelName, actionsTemplate={}) {
        return Object.keys(actionsTemplate).map(function(actionName){
            return [actionName, Object.keys(actionsTemplate[actionName]).map(function(propName){
                return [propName,Y._getProperty(modelName, propName, actionsTemplate[actionName][propName], actionName)];
            }).reduce((obj, val)=> set(obj, val[0], val[1]),{})];
        }).reduce((obj, val)=> set(obj, val[0], val[1]),{});
    }
}

Object.defineProperty(Y, "Observable", {
   get: ()=> Observable
});

export default Y;