/**
 * Created by ychen on 6/16/15.
 */
import Rx           from "rx";
import Property     from "./Property";
import Util         from "./Util";
import Observable   from "./Observable";
import ModelMap     from "./ModelMap";

/**
 *
 *  function(myProp) {
 *
 *  }.requires("MyModel.myProp")
 *
 *
 */
class ComputedProperty extends Property {

    constructor(name, generator, dependencyPropertyNames) {
        super(name);
        this.dependencyPropertyNames = dependencyPropertyNames;
        this.generator = generator;
    }

    get observable() {
        let depPropObservables = this.getDependencyPropObservables(this.dependencyPropertyNames);
        return this.listenToDependencies(depPropObservables, function(){
            let observedValues = Array.from(arguments);
            return this.generator.apply(null, observedValues);
        }.bind(this)).flattenIterable();
    }

    get dependencyProperties() {
        return this.getDependencyProperties(this.dependencyPropertyNames);
    }

    getDependencyPropObservables(modelPropNames) {
        return this.getDependencyProperties(modelPropNames).map(x=>x.observable);
    }

    getDependencyProperties(modelPropNames) {
        return modelPropNames.map(x=>this.getDependencyProperty(x));
    }

    getDependencyProperty(modelPropName) {
        let {modelName, propertyName} = Util.parseDependencyString(modelPropName);
        return ModelMap.get(modelName).properties[propertyName];
    }

    listenToDependencies(depObs, observer) {
        return Observable.combineLatest.apply(this, depObs.concat(observer));
    }
}

export default ComputedProperty;