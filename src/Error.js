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

function warnNotValid(value, msg, predicate) {
    var pred = predicate? predicate : (x=>!x);
    if(pred(value)) {
        console.warn(msg);
    }
}

export default {
    Error, warnNotValid
};