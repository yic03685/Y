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
                this.pipe(actionName, propList);
            }
        } else {
            let propList = [];
            this.actionPropMap.set(actionName, propList);
            this.pipe(actionName, propList);
        }
    }

    pipe(actionName, propList) {
        if(this.actionStartMap.has(actionName)) {
            this.actionStartMap.get(actionName).onCompleted();
        }
        let actionStart = new Rx.Subject();
        let sortedPropList = this.sort(propList);
        let currentInput = actionStart;
        for(var prop of sortedPropList) {
            currentInput = prop.pipe(currentInput);
        }
        currentInput.subscribe(this.onActionEnd);
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
                    queue.push(prop);
                }
            }
        }
        propList.forEach(x=>search(x));
        return queue;
    }

    unregister(actionName, property) {
        if(this.actionPropMap.has(actionName)) {
            let propList = this.actionPropMap.get(actionName);
            let idx = propList.indexOf(property);
            if( idx !== -1) {
                propList.splice(idx,1);
                this.pipe(actionName, propList);
            }
        }
    }

    actionStart(actionName, value) {
        this.actionSet.add(actionName);
        if(this.actionStartMap.has(actionName)){
            this.actionStartMap.get(actionName).onNext(Util.wrapInObservable(value));
        }
    }

    onActionEnd(evt) {
        this.actionSet.remove(evt.actionName);
    }

}

export default new Action();