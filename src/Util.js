/**
 * Created by ychen on 6/6/15.
 */
import Error        from "./Error";
import Constant     from "./Constant";
import Observable   from "./Observable";

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
        return prop && prop["actionName"];
    }

    static wrapInObservable(value) {
        return Array.isArray(value)? Observable.from(value) : Observable.return(value);
    }

}

export default Util;