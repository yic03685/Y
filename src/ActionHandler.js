/**
 * Created by ychen on 6/23/15.
 */
import {Scheduler}          from "rx";
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
        let prop = this.getPropertyByName(this.name);
        let depPropObservables = this.getDependencyProperties().map(this.pipeDependencyObservable.bind(this));
        return this.applyAfterMethods(this.generate([this.pipeInAction(actionIn)].concat(depPropObservables), function(){
            let observedValues = Array.from(arguments);
            return this.collect(this.generator.apply(this, observedValues));
        }.bind(this)), Object.keys(this.afterMethods)).push().distinctUntilChanged().do(x=>prop.observer.onNext(x));
    }

    generate(depObs, generator) {
        return Observable.combineLatest.apply(this, depObs.concat(generator));
    }

    pipeInAction(actionIn) {
        let out = actionIn.pipeOut();
        return this.withTimestamp? out.timestamp(): out;
    }
}

export default ActionHandler;