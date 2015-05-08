import Observable from "./Observable";
import WallClock from "./WallClock";

class Model {

    constructor(name, template) {
        //TODO: Check if both name and template are valid
        this.name = name;
        this.template = template;
        this.documents = [];
        this.store = [];
        this.output = {};
    }

    setupIO() {
        var self = this;
        var proxy = {};
        var keyOb = self.template.call(proxy);
        self.createDocuments(keyOb, proxy);

        // get all properties of the proxy
        var properties = Object.keys(proxy);

        // for all properties that is observable => make input/output for them
        var obProperties = properties.filter(k=>Observable.isObservable(proxy[k]));
        obProperties.forEach(self.listenToObservableProperty);
        obProperties.forEach(setupObOutput);

        // for all properties that is primitives => define a property and output for them
        var nobProperties = properties.filter(k=>!Observable.isObservable(proxy[k]));
        nobProperties.forEach(setupNobOutput);

        function setupObOutput(key) {
            self.output[key] = new Subject();
            Object.defineProperty(self, key, {
                get: ()=> self.output[key]
            });
        }

        function setupNobOutput(key) {
            self.output[key] = new Subject();
            Object.defineProperty(self, key, {
                get: ()=> self.output[key],
                set: (val) => self.onPropertyChanged(key, val)
            });
        }
    }

    createDocuments(ob, proxy) {
        var self = this;
        var template = Object.keys(proxy).reduce((obj,k)=>{
            obj[k] = Observable.isObservable(proxy[k])? null : proxy[k];
            return obj;
        },{});
        ob.collect().subscribe(function(ls){
            self.documents = ls.map(x=>template);
        });
        WallClock.next();
    }

    listenToObservableProperty(key, proxy) {
        var self = this;
        var ob = proxy[key];
        ob.subscribe(function(val){
            self.onPropertyChanged(key, val);
        });
    }

    onPropertyChanged(key, value) {
        var self = this;
        //TODO: filter or other operations to get a subset of the documents
        this.documents.forEach(function(document){
            document[key] = value;
            self.output[key].onNext(value);
        });
        WallClock.next();
    }
}

export default Model;