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
        return this.generate([this.pipeInAction(actionIn)].concat(depPropObservables), function(){
            let observedValues = Array.from(arguments);
            let ret = this.generator.apply(this, observedValues);
            return Observable.isObservable(ret)? ret.toArray(): [ret];
        }.bind(this)).pipeIn().distinctUntilChanged().do(x=>prop.observer.onNext(x));
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