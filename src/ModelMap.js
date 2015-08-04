/**
 * Created by ychen on 5/30/15.
 */
class ModelMap {
    constructor() {
        this.map = new Map();
    }

    get(name) {
        if(this.map.has(name)) {
            return this.map.get(name);
        } else {
            throw "No model named " + name + " is found.";
        }
    }

    has(name) {
        return this.map.has(name);
    }

    add(name, instance) {
        if(this.map.has(name)) {
            throw name + " is redefined.";
        } else {
            return this.map.set(name, instance);
        }
    }

    list() {
        let entries = [];
        for (var value of this.map.values()) {
            entries.push(value);
        }
        return entries;
    }

    remove (name) {
        if (this.map.has(name)) {
            this.map.delete(name);
        }
    }
}

export default new ModelMap();