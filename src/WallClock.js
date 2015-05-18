import Rx from "rx";
import Constant from "./Constant";

class WallClock {

    constructor() {
        this.tick = new Rx.Subject();
        this.documentContext = null;
        this.propertyContext = null;
    }

    clear() {
        this.documentContext = null;
        this.propertyContext = null;
    }

    onNextTick(type) {
        return this.tick.filter(x=>!type || (x === type));
    }

    dStart() {
        if(this.documentContext !== Constant.DOCUMENT_TIME_START) {
            this.documentContext = Constant.DOCUMENT_TIME_START;
            this.tick.onNext(Constant.DOCUMENT_TIME_START, Rx.Scheduler.immediate);
        }
    }

    dEnd() {
        // End won't be issued when there's no previous document start
        if(this.documentContext === Constant.DOCUMENT_TIME_START) {
            this.documentContext = null;
            this.tick.onNext(Constant.DOCUMENT_TIME_END, Rx.Scheduler.immediate);
        }
    }

    pStart() {
        this.propertyContext = Constant.PROPERTY_TIME_START;
        this.tick.onNext(Constant.PROPERTY_TIME_START, Rx.Scheduler.immediate);
    }

    pEnd() {
        // End won't be issued
        // 1. when there's no previous property start
        // 2. until all the documents are done
        if(this.propertyContext === Constant.PROPERTY_TIME_START) {
            setImmediate(issueEnd);
        }
        var self = this;
        function issueEnd() {
            if(!self.documentContext && self.propertyContext === Constant.PROPERTY_TIME_START) {
                self.propertyContext = null;
                self.tick.onNext(Constant.PROPERTY_TIME_END, Rx.Scheduler.immediate);
            }
        }
    }
}

export default new WallClock();