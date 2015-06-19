/**
 * Created by ychen on 6/16/15.
 */
import Rx                   from "rx";
import {flatten}            from "lodash";
import ComputedProperty     from "./ComputedProperty";
import Action               from "./Action";
import Observable           from "./Observable";
import {wrapInObservable}   from "./Util";

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
        this.currentValue = new Rx.BehaviorSubject();// {Observable}
        this.currentValue.onNext(wrapInObservable(defaultValue));
    }

    get observable() {
        return this.currentValue;
    }

    pipe (actionIn) {
        Observable.zip.apply(this, [actionIn].concat(this.getDependencyObservable()).concat(function(){
            let params = flatten(Array.from(arguments));
            return this.generator.apply(null, params);
        }.bind(this))).flattenIterable().do(x=>this.setCurrentValue(x));
        return this._observable;
    }

    getDependencyObservable() {
        let dependencyPropObservables = this.getDependencyPropObservables(this.dependencyPropertyNames);
        return Observable.combineLatest.apply(this, [this.currentValue].concat(dependencyPropObservables).concat(function(){
            return Array.from(arguments);
        }));
    }

    setCurrentValue(observable) {
        this.currentValue.onNext(observable);
    }
}

export default StateProperty;