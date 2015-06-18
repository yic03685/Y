/**
 * Created by ychen on 6/6/15.
 */

import Error        from "./Error";
import Constant     from "./Constant";
import Observable   from "./Observable";

class Util {

    static parseDependencyString(str) {
        return str===Constant.SELF_PROPERTY_NAME? str : str.match(/^[a-z|A-Z|0-9]+\.[a-z|A-Z|0-9]+$/) === null? new Error(["",""], Constant.ERROR_MSG.DEPENDENCY_FORMAT_ERROR, str) : (()=>str.split("."))();
    }

    static isStateProperty(prop) {
        return prop && prop["actionName"];
    }

    static wrapInObservable(value) {
        return Array.isArray(value)? Observable.from(value) : Observable.return(value);
    }

}

export default Util;