/**
 * Created by ychen on 6/6/15.
 */

import Error from "./Error";
import Constant from "./Constant";

class Util {

    static parseDependencyString(str) {
        return str.match(/^[a-z|A-Z|0-9]+\.[a-z|A-Z|0-9]+$/) === null? new Error(["",""], Constant.ERROR_MSG.DEPENDENCY_FORMAT_ERROR, str) : (()=>str.split("."))();
    }

}

export default Util;