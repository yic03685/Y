import {set, partition, isEqual}    from "lodash";
import {isStateProperty}            from "./Util";
import Observable                   from "./Observable";

class Model {

    constructor(name, properties) {
        this.name = name;
        this.properties = properties;
    }

    //------------------------------------------------------------------------
    //
    //                              Public
    //
    //------------------------------------------------------------------------

    observe(propNameList) {
        let result, cached;
        let propNames = Array.isArray(propNameList)? propNameList: Array.from(arguments);
        if (propNames.length === 1) {
            result = this.properties[propNames].observable.wrap().map(this.formatToPrimitive);
        } else {
            let obs = propNames.map(x=>this.properties[x].observable.wrap());
            result = Observable.combineLatest.apply(this, obs.concat(function(){
                let values = Array.from(arguments);
                return this.bundleProperties(propNames, values);
            }.bind(this)));
        }
//        return result.filter(x=>!isEqual(x,cached)).do(x=>cached=x);
        return result;
    }

    observeAll() {
        return this.observe(Object.keys(this.properties));
    }

    //------------------------------------------------------------------------
    //
    //                              Private
    //
    //------------------------------------------------------------------------

    formatToPrimitive(value) {
        return Array.isArray(value) && value.length? value[0] : value;
    }

    // {[string]},{[[number]|number]} => {[object]}
    bundleProperties(propertyNames, propertyValues) {
        let formatValues = propertyValues.map(this.formatToPrimitive);
        return formatValues.reduce((doc,v,i)=>set(doc,propertyNames[i],v),{});
    }
}

export default Model;