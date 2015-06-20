/**
 * Created by ychen on 6/16/15.
 */
import Rx                   from "rx";
import {flatten}            from "lodash";
import ComputedProperty     from "./ComputedProperty";
import Action               from "./Action";
import Observable           from "./Observable";
import Util                 from "./Util";

/**
 *
 *  function(evt, currentValues, myProp) {
 *
 *  }.requires("@MyModel.myProp").action("myAction").default(1)
 *
 *
 */
class StateProperty extends ComputedProperty {

    constructor(name, generator, dependencyPropertyNames, actionName, defaultValue, resetPropertyNames=[]) {
        super(name, generator, dependencyPropertyNames);
        this.resetPropertyNames = resetPropertyNames;
        this.actionName = actionName;
        this.defaultValue = defaultValue;
        this.currentValue = new Rx.BehaviorSubject();// {Observable}
        this.currentValue.onNext(Util.wrapInObservable(defaultValue));
        this.registerAction();
    }

    get observable() {
        return Observable.merge(Observable.merge.apply(this, this.getDependencyPropObservables(this.resetPropertyNames)).wrap().map(function(values){
            return values.length>1? Observable.from(Array.from({length:values.length}).map(x=>this.defaultValue)) : Observable.return(this.defaultValue);
        }.bind(this))).do(x=>this.setCurrentValue(x));
    }

    registerAction() {
        if(this.actionName) {
            Action.register(this.actionName, this);
        }
    }

    pipe (actionIn) {
        return Observable.zip.apply(this, [actionIn].concat(this.getDependencyObservables()).concat(function(){
            let params = flatten(Array.from(arguments));
            return this.generator.apply(null, params);
        }.bind(this))).flattenIterable().do(x=>this.setCurrentValue(x));
    }

    getDependencyObservables() {
        let dependencyPropObservables = this.getDependencyPropObservables(this.dependencyPropertyNames);
        return Observable.combineLatest.apply(this, [this.observable].concat(dependencyPropObservables).concat(function(){
            return Array.from(arguments);
        }));
    }

    setCurrentValue(observable) {
        this.currentValue.onNext(observable);
    }
}

export default StateProperty;