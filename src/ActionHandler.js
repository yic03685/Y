/**
 * Created by ychen on 6/23/15.
 */
import Util                 from "./Util";
import ComputedProperty     from "./ComputedProperty";

/**
 *
 * actions: {
 *      myAction: {
 *          myProp: function(action, current, otherProps...) {
 *          }
 *      }
 * }
 *
 */

class ActionHandler extends ComputedProperty {

    pipe(actionIn) {
        let currentValue = Util.getPropertyByName(this.name).observable;
        let depPropObservables = this.getDependencyProperties().map(x=>x.observable);
        return this.generate([actionIn].concat(currentValue).concat(depPropObservables), function(){
            let observedValues = Array.from(arguments);
            return this.generator.apply(null, observedValues);
        }.bind(this)).flattenIterable();
    }

    generate(depObs, generator) {
        return Observable.zip.apply(this, depObs.concat(generator));
    }

}

export default ActionHandler;