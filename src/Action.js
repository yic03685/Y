/**
 * Created by ychen on 6/17/15.
 */
import {Subject}    from "rx";
import Util         from "./Util";
import Observable   from "./Observable";


class Action {

    constructor() {
        this.actionStartMap = new Map();    // map actionName => subject
        this.actionPropMap = new Map();     // map actionName => [property]
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

    actionStart(actionName, value="") {
        if(!this.actionStartMap.has(actionName)){
            let propAffected = this.actionPropMap.get(actionName);
            if(propAffected) {
                this.pipe(actionName, propAffected);
            } else {
                console.warn(`Nothing will be changed by performing action ${actionName}. (Probably misspell the action name?)`);
            }
        }
        this.actionStartMap.get(actionName).onNext(JSON.stringify(value));
    }

    removePipe(actionName) {
        if(this.actionStartMap.has(actionName)) {
            this.actionStartMap.get(actionName).onCompleted();
            this.actionStartMap.remove(actionName);
        }
    }

    pipe(actionName, propList) {
        let actionStart = new Subject();
        let sortedPropList = this.sort(propList, actionName);
        let visited = new WeakMap();

        // {Property},{Observable} => {Observable}
        function _pipe(prop, actionIn) {
            if(!prop) {
                return null;
            }
            if(visited.has(prop)) {
                return visited.get(prop);
            }
            let dependencyObList = prop.getDependencyProperties(actionName).map(x=>_pipe(x, actionIn)).filter(x=>!!x);
            let dependencyOb = dependencyObList.length? Observable.zip.apply(this, dependencyObList.concat(x=>x)) : actionIn;
            let actionOut = Util.isActionHandler(prop)? prop.pipe(dependencyOb? dependencyOb : actionIn) : dependencyOb;
            visited.set(prop, actionOut);
            return actionOut;
        }
        if(sortedPropList.length) {
            Observable.combineLatest.apply(this, sortedPropList.map(prop=>_pipe(prop, actionStart)).concat(x=>x)).subscribe(this.onActionEnd.bind(this));
        }
        this.actionStartMap.set(actionName, actionStart);
    }

    sort(propList, actionName) {
        let visited = new Set();
        let queue = [];
        propList.forEach(x=>search(x));
        return queue;

        function search(prop) {
            if(!visited.has(prop)) {
                visited.add(prop);
                prop.getDependencyProperties(actionName).forEach(x=>search(x));
                if(Util.isActionHandler(prop)){
                    queue.unshift(prop);
                }
            }
        }
    }

    onActionEnd(evt) {
    }

}

export default new Action();