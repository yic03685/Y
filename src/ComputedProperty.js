/**
 * Created by ychen on 6/16/15.
 */
import {BehaviorSubject}    from "rx";
import Property             from "./Property";
import Util                 from "./Util";
import Observable           from "./Observable";
import {warnNotValid}       from "./Error";

/**
 *
 *  function(myProp) {
 *
 *  }.requires("MyModel.myProp")
 *
 *
 */
class ComputedProperty extends Property {

    constructor(name, generator, dependencyPropertyNames=[], withTimestamp=false, methods=[]) {
        super(name);
        this.dependencyPropertyNames = dependencyPropertyNames;
        this.generator = generator;
        this.withTimestamp = withTimestamp;
        this.afterMethods = methods;
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
            return this.collect(this.generator.apply(this, observedValues));
        }.bind(this)).flatten().innerChain(this.afterMethods).stringify().distinctUntilChanged().subscribe(x=>{
            this.pipeOut.onNext(x)
        });
    }

    /**
     * The value can be an observable, iterable, primitive value, null or undefined
     * If it is an observable, collect all the observing sequence and convert it to an iterable then do iterable
     * If it is an undefined, do nothing
     * @param value
     */
    collect(value) {
        warnNotValid(value, `${this.name} has an invalid generator, use null instead of undefined if intended`, x=>x===undefined);
        return Observable.isObservable(value)? value.toArray() : [value];
    }

    pipeDependencyObservable(prop) {
        let out = prop.observable.parse();
        return this.withTimestamp? out.timestamp(): out;
    }

    getDependencyProperties(actionName="") {
        return this.getPropertiesByNames(this.dependencyPropertyNames, actionName);
    }

    generate(depObs, generator) {
        return Observable.combineLatest.apply(this, depObs.concat(generator));
    }
}

export default ComputedProperty;