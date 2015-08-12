import {set, values}                from "lodash";
import {isStateProperty}            from "./Util";
import Observable                   from "./Observable";
import Action                       from "./Action";
import ModelMap                     from "./ModelMap";

class Model {

    constructor(name, properties, actions={}) {
        this.name = name;
        this.properties = properties;
        this.actions = actions;
        this.registerActions();
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
        return this.observe(Object.keys(this.properties).filter(x=>x.match(/^[\$|_]/)===null));
    }

    remove() {
        ModelMap.remove(this.name);
        return values(this.properties).forEach(x=>x.remove());
    }

    //------------------------------------------------------------------------
    //
    //                              Private
    //
    //------------------------------------------------------------------------

    formatToPrimitive(str) {
        return JSON.parse(str);
    }

    /**
     * If all the observed values have the same length => bundle them into an object
     * If otherwise, extend the last value to match the longest length
     * ex. foo: [1,2], bar: [1,2,3] =>
     * [{ foo: 1, bar: 1 }, { foo: 2, bar: 2 }, { foo: 2, bar: 3 }]
     * @param {[string]} propertyNames
     * @param {[[number]|number]} propertyValues
     * @returns {[object]}
     */
    bundleProperties(propertyNames, propertyValues) {
        let formatValues = propertyValues.map(this.formatToPrimitive);
        let longestLen = formatValues.reduce((m,vals)=> Math.max(m, vals.length?  vals.length: 1), -1);
        let obj = Array.from({length:longestLen}).map(x=>({}));

        for(let i=0; i<propertyNames.length; ++i) {
            let key = propertyNames[i];
            let ls = formatValues[i];
            let lastValidVal = Array.isArray(ls)? ls[0] : ls;
            if (lastValidVal !== undefined) {
                for(let j=0; j<longestLen; ++j) {
                    let val = ls[j] !== undefined ? ls[j] : lastValidVal;
                    obj[j][key] = val;
                    lastValidVal = val;
                }
            }
        }
        return obj.length === 1? obj[0] : obj;
    }

    registerActions() {
        var self = this;
        Object.keys(this.actions)
            .forEach(function(actionName){
                Object.keys(self.actions[actionName]).forEach(function(propName){
                    Action.register(actionName, self.actions[actionName][propName]);
                });
            });
    }
}

export default Model;