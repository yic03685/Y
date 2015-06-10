/**
 * Created by ychen on 6/6/15.
 */

import Constant from "./Constant";

function Error (retValue, errorMsg, obj) {
    if(errorMsg) {
        console.warn(errorMsg + " (" + obj +") ");
    }
    return retValue;
}

export default Error;