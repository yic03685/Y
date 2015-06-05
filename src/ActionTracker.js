/**
 * Created by ychen on 6/5/15.
 */

class ActionTracker {

    constructor() {
        this.visited = new Set();
    }

    start() {
        setImmediate(this.done);
    }

    visit(modelName) {
        this.visited.add(modelName);
    }

    isVisited(modelName) {
        return this.visited.has(modelName);
    }

    done() {
        this.visited = new Set();
    }
}

export default new ActionTracker();

