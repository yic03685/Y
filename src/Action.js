/**
 * Created by ychen on 6/17/15.
 */

class Action {

    constructor() {
        this.actionStartMap = new Map();    // map actionName => subject
        this.actionPropMap = new Map();     // map actionName => [property]
        this.actionSet = new Set();
    }

    register(actionName, property) {

    }

    unregister(actionName, property) {

    }

    actionStart(actionName) {
        this.actionSet.add(actionName);
    }

    onActionEnd(evt) {
        this.actionSet.remove(evt.actionName);
    }

}

export default new Action();