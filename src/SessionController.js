/**
 * Created by ychen on 5/23/15.
 */

class Session {

    constructor() {
        this.sources = [];
    }

    addSource(src) {
        if( this.sources.indexOf(src) === -1) {
            this.sources.push(src)
        }
    }

    removeSource(src) {
        var idx = this.sources.indexOf(src);
        if( idx !== -1 ) {
            this.sources.splice(idx, 1);
        }
    }

    requestNext() {
        this.sources.forEach(src=>src.request(1));
    }

    deposit(valueWithContext) {
        this.context = valueWithContext.context;
        return valueWithContext.data;
    }

    withdraw(value) {
        return {
            data: value,
            context: this.context
        }
    }
}

class SessionController {

    constructor() {
        this.sessions = new Map();
    }

    create(id) {
        return this.sessions.has(id) ? this.sessions.get(id) : this.sessions.set(id, new Session());
    }

    get(id) {
        return this.sessions.get(id);
    }
}

export default new SessionController();