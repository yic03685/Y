/**
 * Created by ychen on 6/17/15.
 */
import Util from "./Util";

class Action {

    constructor() {
        this.actionStartMap = new Map();    // map actionName => subject
        this.actionPropMap = new Map();     // map actionName => [property]
        this.actionSet = new Set();
    }

    register(actionName, property) {
        if(this.actionPropMap.has(actionName)) {
            let propList = this.actionPropMap.get(actionName);
            if(propList.indexOf(property) === -1) {
                propList.push(property);
            }
        } else {
            let propList = [property];
            this.actionPropMap.set(actionName, propList);
        }
        this.removePipe();
    }

    unregister(actionName, property) {
        if(this.actionPropMap.has(actionName)) {
            let propList = this.actionPropMap.get(actionName);
            let idx = propList.indexOf(property);
            if(idx !== -1) {
                propList.splice(idx,1);
                this.pipe(actionName, propList);
                if(!propList.length) {
                    this.actionPropMap.remove(actionName);
                    this.actionStartMap.remove(actionName);
                }
            }
        }
        this.removePipe();
    }

    actionStart(actionName, value) {
        if(!this.actionStartMap.has(actionName)){
            this.pipe(actionName, this.actionPropMap.get(actionName));
        }
        this.actionSet.add(actionName);
        this.actionStartMap.get(actionName).onNext(Util.wrapInObservable(value));
    }

    removePipe(actionName) {
        if(this.actionStartMap.has(actionName)) {
            this.actionStartMap.get(actionName).onCompleted();
            this.actionStartMap.remove(actionName);
        }
    }

    pipe(actionName, propList) {
        let actionStart = new Rx.Subject();
        let sortedPropList = this.sort(propList);
        let visited = new WeakMap();
        // {Property},{Observable} => {Observable|null}
        function _pipe(prop, actionIn) {
            if(!prop) {
                return null;
            }
            if(visited.has(prop)) {
                return visited.get(prop);
            }
            let dependencyObList = prop.getDependencyProperties().map(x=>_pipe(x, actionIn)).filter(x=>!!x);
            let dependencyOb = dependencyObList.length? Observable.forkJoin.apply(this, dependencyObList) : null;
            let actionOut = Util.isStateProperty(prop)? prop.pipe(actionName, dependencyOb? dependencyOb : actionIn) : dependencyOb;
            visited.set(prop, actionOut);
            return actionOut;
        }
        if(sortedPropList.length) {
            _pipe(sortedPropList[0], actionStart).subscribe(this.onActionEnd);
        }
        this.actionStartMap.set(actionName, actionStart);
    }

    sort(propList) {
        let visited = new Set();
        let queue = [];
        function search(prop) {
            if(!visited.has(prop)) {
                visited.add(prop);
                prop.getDependencyProperties().forEach(x=>search(x));
                if(Util.isStateProperty(prop)){
                    queue.unshift(prop);
                }
            }
        }
        propList.forEach(x=>search(x));
        return queue;
    }

    onActionEnd(evt) {
        this.actionSet.remove(evt.actionName);
    }

}

export default new Action();