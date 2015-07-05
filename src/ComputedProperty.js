/**
 * Created by ychen on 6/16/15.
 */
import {BehaviorSubject}    from "rx";
import Property             from "./Property";
import Util                 from "./Util";
import Observable           from "./Observable";


/**
 *
 *  function(myProp) {
 *
 *  }.requires("MyModel.myProp")
 *
 *
 */
class ComputedProperty extends Property {

    constructor(name, generator, dependencyPropertyNames=[], withTimestamp=false) {
        super(name);
        this.dependencyPropertyNames = dependencyPropertyNames;
        this.generator = generator;
        this.withTimestamp = withTimestamp;
        this.pipeIn = null;
        this.pipeOut = new BehaviorSubject();
    }

    get observable() {
        if(!this.pipeIn) {
            this.pipeIn = this.pipe();
        }
        return this.pipeOut.filter(x=>x!==undefined);
    }

    pipe() {
        let depPropObservables = this.getDependencyProperties().map(this.pipeDependencyObservable.bind(this));
        return this.generate(depPropObservables, function(){
            let observedValues = Array.from(arguments);
            let ret = this.generator.apply(this, observedValues);
            return Observable.isObservable(ret)? ret.toArray(): [ret];
        }.bind(this)).pipeIn().distinctUntilChanged().subscribe(x=>{
            this.pipeOut.onNext(x)
        });
    }

    pipeDependencyObservable(prop) {
        let out = prop.observable.pipeOut();
        return this.withTimestamp? out.timestamp(): out;
    }

    getDependencyProperties(actionName="") {
        return Util.getPropertiesByNames(this.dependencyPropertyNames, actionName);
    }

    generate(depObs, generator) {
        return Observable.combineLatest.apply(this, depObs.concat(generator));
    }
}

export default ComputedProperty;