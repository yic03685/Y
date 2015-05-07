import {Observable} from "rx";
import {next} from "./Clock";

Observable.prototype.collect = function(context) {
    return Observable.zip(
        next.filter(x=>x===context),
        this.buffer(next).filter(ls=>ls.length),
        (c,v) => v
    );
};

export default Observable;