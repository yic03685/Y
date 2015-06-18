/**
 * Created by ychen on 6/16/15.
 */
import Rx               from "rx";
import {flatten}        from "lodash";
import ComputedProperty from "./ComputedProperty";
import Action           from "./Action";
import Observable       from "./Observable";

/**
 *
 *  function(evt, currentValues, myProp) {
 *
 *  }.requires("MyModel.myProp").action("myAction").default(1)
 *
 *
 */
class StateProperty extends ComputedProperty {

    constructor(name, generator, dependencyPropertyNames, actionName, defaultValue) {
        super(name, generator, dependencyPropertyNames);
        this.actionName = actionName;
        this.defaultValue = defaultValue;
        this.currentValue = null;
    }

    get observable() {
        let actionIn = Action.register(this.actionName, this);
        return Observable.zip.apply(this, [actionIn].concat(this.getDependencyObservable()).concat(function(){
            let params = flatten(Array.from(arguments));
            return this.generator.apply(null, params);
        }.bind(this)));
    }

    getDependencyObservable() {
        let dependencyPropObservables = this.getDependencyPropObservables(this.dependencyPropertyNames);
        let currentValue = Observable.return(this.wrapInObservable(this.currentValue? this.currentValue: this.defaultValue));
        return Observable.combineLatest.apply(this, [currentValue].concat(dependencyPropObservables).concat(function(){
            return Array.from(arguments);
        }));
    }
}

export default StateProperty;