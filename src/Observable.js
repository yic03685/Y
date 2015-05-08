import {Observable, Scheduler} from "rx";
import WallClock from "./WallClock";
import RSVP from "rsvp";

Observable.prototype.asyncMap = function(generator) {
    let context = WallClock.context;
    var ls = this.collect().flatMap(function(ls){
        var promises = ls.map(generator);
        return !isPromiseList(promises)? [promises] : RSVP.all(promises);
    });

    ls.first().subscribe(function(){
        WallClock.next(context);
    }, Scheduler.immediate);

    return ls.flatMap(function(x){
        return x;
    });

    function isPromiseList(ls) {
        return ls.reduce((b,x)=> b && !!x.then, true);
    }
};


//Observable.prototype.collect = function(context) {
//
//    tick.filter(x=>!context || x===context).subscribe(x=>console.log("TICK"));
//    this.buffer(tick).filter(ls=>ls.length).subscribe(x=>console.log("BUFFERED"));
//
//    return Observable.combineLatest(
//        tick.filter(x=>!context || x===context),
//        this.buffer(tick).filter(ls=>ls.length),
//        (c,v) => {
////            console.log(c,v);
//            return v;
//        }
//    );
//};

Observable.prototype.collect = function() {
    return this.buffer(WallClock.tick).filter(ls=>!!ls.length);
};

Observable.isObservable = function(obj) {
    return !!obj.scheduler;
};

export default Observable;