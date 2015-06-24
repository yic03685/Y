/**
 * Created by ychen on 6/6/15.
 */
import Error        from "./Error";
import Constant     from "./Constant";
import Observable   from "./Observable";
import ModelMap     from "./ModelMap";

class Util {

    static parseDependencyString(str) {
        return isValidDependency(str)? parseDependency(str) : new Error({
            modelName: "", propertyName: ""
        }, Constant.ERROR_MSG.DEPENDENCY_FORMAT_ERROR, str);

        function isValidDependency(str) {
            return str.match(/^[a-z|A-Z|0-9]+\.[a-z|A-Z|0-9]+$/) !== null;
        }
        function parseDependency(str) {
            let [modelName, propertyName] = str.split(".");
            return { modelName, propertyName };
        }
    }

    static isStateProperty(prop) {
        return !!(prop && prop["actionName"]);
    }

    static isActionHandler(prop) {
        return !!(prop && prop["actionName"]);
    }

    static getPropertiesByNames(modelPropNames, actionName="") {
        return modelPropNames.map(x=>Util.getPropertyByName(x, actionName)).filter(x=>!!x);
    }

    static getPropertyByName(modelPropName, actionName="") {
        let {modelName, propertyName} = Util.parseDependencyString(modelPropName);
        let model = ModelMap.get(modelName);
        let property = model.properties[propertyName];
        return (Util.isStateProperty(property) && actionName!=="")? model.actions[actionName][propertyName] : property;
    }

    static print(ob) {
        ob.subscribe(x=>console.log(x));
    }
}

export default Util;