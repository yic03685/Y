/**
 * Created by ychen on 6/23/15.
 */
import {Scheduler}          from "rx";
import Util                 from "./Util";
import ComputedProperty     from "./ComputedProperty";
import Observable           from "./Observable";

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
        let prop = Util.getPropertyByName(this.name);
        let depPropObservables = this.getDependencyProperties().map(x=>x.observable.pipeOut());
        return this.generate([actionIn.pipeOut()].concat(depPropObservables), function(){
            let observedValues = Array.from(arguments);
              return this.generator.apply(null, observedValues).toArray();
        }.bind(this)).pipeIn().distinctUntilChanged().do(x=>prop.observer.onNext(x));
    }

    generate(depObs, generator) {
        return this.combineMethod.apply(this, depObs.concat(generator));
    }
}

export default ActionHandler;