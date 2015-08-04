/**
 * Created by ychen on 6/16/15.
 */
import Observable               from "./Observable";
import Util                     from "./Util";
import ModelMap                 from "./ModelMap";
import {warnNotValid}           from "./Error";

class Property {

    constructor(name) {
        this.name = name;
    }

    get observable() {}

    remove() {}

    getDependencyProperties(actionName="") {
        return [];
    }

    getPropertiesByNames(modelPropNames, actionName="") {
        return modelPropNames.map(x=>this.getPropertyByName(x, actionName)).filter(x=>!!x);
    }

    getPropertyByName(modelPropName, actionName="") {
        let {modelName, propertyName} = Util.parseDependencyString(modelPropName);
        let model = ModelMap.get(modelName===""? Util.parseDependencyString(this.name).modelName : modelName);
        let property = model.properties[propertyName];
        warnNotValid(property, `There is no property named ${propertyName} in the model`);
        return (Util.isStateProperty(property) && actionName!=="")? model.actions[actionName][propertyName] : property;
    }
}

export default Property;