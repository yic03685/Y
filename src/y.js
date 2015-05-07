import Rx from "rx";
import Observable from "./Observable";

class Y {

}

let instance = new Y();

Object.defineProperty(instance, "Observable", {
   get: ()=> Observable
});

export default instance;