import {set}                        from "lodash";
import {isStateProperty}            from "./Util";
import Observable                   from "./Observable";
import Action                       from "./Action";

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