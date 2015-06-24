/**
 * Created by ychen on 6/16/15.
 */
import Property     from "./Property";
import Util         from "./Util";
import Observable   from "./Observable";

/**
 *
 *  function(myProp) {
 *
 *  }.requires("MyModel.myProp")
 *
 *
 */
class ComputedProperty extends Property {

    constructor(name, generator, dependencyPropertyNames=[]) {
        super(name);
        this.dependencyPropertyNames = dependencyPropertyNames;
        this.generator = generator;
    }

    get observable() {
        let depPropObservables = this.getDependencyProperties().map(x=>x.observable.pipeOut());
        return this.generate(depPropObservables, function(){
            let observedValues = Array.from(arguments);
            return this.generator.apply(null, observedValues).toArray();
        }.bind(this)).flattenIterable().pipeIn();
    }

    getDependencyProperties(actionName="") {
        return Util.getPropertiesByNames(this.dependencyPropertyNames, actionName);
    }

    generate(depObs, generator) {
        return Observable.combineLatest.apply(this, depObs.concat(generator));
    }
}

export default ComputedProperty;