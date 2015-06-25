import {set, partition, isEqual}    from "lodash";
import {isStateProperty}            from "./Util";
import Observable                   from "./Observable";

class Model {

    constructor(name, properties, actions={}) {
        this.name = name;
        this.properties = properties;
        this.actions = actions;
    }

    //------------------------------------------------------------------------
    //
    //                              Public
    //
    //------------------------------------------------------------------------

    observe(propNameList) {
        let result;
        let propNames = Array.isArray(propNameList)? propNameList: Array.from(arguments);
        if (propNames.length === 1) {
            result = this.properties[propNames].observable.map(this.formatToPrimitive);
        } else {
            let obs = propNames.map(x=>this.properties[x].observable);
            result = Observable.combineLatest.apply(this, obs.concat(function(){
                let values = Array.from(arguments);
                return this.bundleProperties(propNames, values);
            }.bind(this)));
        }
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

    formatToPrimitive(str) {
        var value = JSON.parse(str);
        return Array.isArray(value) && value.length? value[0] : value;
    }

    // {[string]},{[[number]|number]} => {[object]}
    bundleProperties(propertyNames, propertyValues) {
        let formatValues = propertyValues.map(this.formatToPrimitive);
        return formatValues.reduce((doc,v,i)=>set(doc,propertyNames[i],v),{});
    }
}

export default Model;