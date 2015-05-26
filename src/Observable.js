import Constant from "./Constant";
import {Observable, Scheduler} from "rx";
import Rx from "rx";
import WallClock from "./WallClock";
import RSVP from "rsvp";
import SessionController from "./SessionController";

Observable.prototype.sessionEnd = function (id) {
    return this.map(function(x){
       return SessionController.get(id).withdraw(x);
    }).do(function(){
        SessionController.get(id).requestNext();
    });
};

Observable.prototype.sessionStart = function (id) {
    return this.map(function(x){
        return SessionController.get(id).deposit(x);
    });
};

Observable.isObservable = function(obj) {
    return !!obj.scheduler;
};

export default Observable;