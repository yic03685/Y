import {Subject, BehaviorSubject, Scheduler} from "rx";
import {pick, values, flatten, isFunction, memoize, partition, isEqual, curry, set, pluck} from "lodash";
import bootstrap from "./bootstap";
import Observable from "./Observable";
import Constant from "./Constant";
import ModelMap from "./ModelMap";
import Capture from "./Capture";
import ActionTracker from "./ActionTracker";
import Util from "./Util";
import Error from "./Error";

class StatelessModel {

    constructor(name, stateProperties, computedProperties) {
        this.name = name;
        this.documents = this.documents? this.documents : [];
        this.constantProperties = this.constantProperties? this.constantProperties : {};
        this.stateProperties = stateProperties || {};
        this.computedProperties = computedProperties || {};
        this.observables = new Map();
        this.timeCounters = new Map();
        this.setupComputedProperties();
        this.setupStateProperties();
        this.parents = this.findParents();
        this.setupActionProxy();
        this.memoizedGetObservable = this.getObservableForProperty();
    }

    //--------------------------------------------------------------------------
    //
    //                             Public
    //
    //--------------------------------------------------------------------------

    observe() {
        let keys = Array.from(arguments);
        return this.combineLatestToObject(keys);

    }

    observeAll() {
        let keys = Object.keys(this.computedProperties);
        return this.combineLatestToObject(keys);
    }

    //--------------------------------------------------------------------------
    //
    //                            Private
    //
    //--------------------------------------------------------------------------

    combineLatestToObject(keys) {
        return Observable.combineLatest.apply(null,
            values(pick(this, keys)).concat(function(){
                return Array.from(arguments).reduce((o,v,i)=>set(o, keys[i], v[0]),{});
            })
        );
    }

    applyPropertyValuesToDocuments(propertyName, values) {
        let self = this, isChanged = false;
        (Array.isArray(values)? values: [values]).forEach((v,i)=>{
            if(!self.documents[i]) {
                self.documents[i] = {};
            }
            if(self.documents[i][propertyName] !== v) {
                self.documents[i][propertyName] = v;
                isChanged = true;
            }
        });
        return values;//isChanged? values : null;
    }

    setupComputedProperties () {
        Object.keys(this.computedProperties).forEach(defineProperty.bind(this));

        /**
         * Define the property with a key for this model
         * @param {string} propertyName
         */
        function defineProperty(propertyName) {
            Object.defineProperty(this, propertyName, {
                get: ()=>{
                    return this.memoizedGetObservable(propertyName);
                }
            });
        }
    }

    setupStateProperties() {
        Object.keys(this.stateProperties).forEach(defineProperty.bind(this));


        /**
         * Define the property with a key for this model
         * @param {string} propertyName
         */
        function defineProperty(propertyName) {
            Object.defineProperty(this, propertyName, {
                get: ()=>{
                    return this.memoizedGetObservable(propertyName);
                }
            });
        }
    }

    /**
     * Parse the dependency strings => get dependency observables => connect them to the compute function => route the changes to change documents
     * and finally memoize the entire process
     * @returns {Observable}
     */
    getObservableForProperty() {
        var self = this;
        return memoize(function(name) {
            let {compute, dependencies, state} = getObservableProperty(name);
            return self.compute(name, compute, self.getDependencyProperties(name, dependencies, state));
        }.bind(this));

        function getObservableProperty(propertyName) {
            let computedProperty = self.computedProperties[propertyName] || self.stateProperties[propertyName];
            return typeof computedProperty === "string"? getObservableProperty(computedProperty) : (isFunction(computedProperty)? {compute:computedProperty, dependencies:[]} : computedProperty);
        }
    }

    /**
     * Pipe the observable needed from dependencies
     * @param {[Observable]} dependencyProperties
     * @param {function} template
     * @param {string} propertyName
     * @returns {Observable}
     */
    compute(propertyName, template, dependencyProperties) {
        var self = this;
        var applyPropertyValuesToDocuments = curry(this.applyPropertyValuesToDocuments)(propertyName).bind(this);
        var handleLoop = this.observables.has(propertyName)? curry(this.handleLoop)(propertyName).bind(this): (v)=>Observable.return(v);
        return Observable.combineLatest.apply(this, dependencyProperties.concat(function () {
            return Array.from(arguments).map(x=>Array.isArray(x) ? Observable.from(x) : Observable.return(x));
        })).flatMap(function (properties) {
                var res = template.apply(null, properties.concat(self.timeCounters.get(propertyName)));
                return res === null ? res : (Observable.isObservable(res) ? res : res[propertyName]).toArray();
            })
            .flatMap(handleLoop)
            .map(applyPropertyValuesToDocuments);
//            .filter(StatelessModel.anyUpdate);
    }

    handleLoop(propertyName, values) {
        return !isRecursive(values)? Observable.return(values): values[0].toArray().do((values)=>{
            this.timeCounters.set(propertyName, this.timeCounters.get(propertyName)+1);
            this.observables.get(propertyName).onNext(values);
        });
        function isRecursive() {
            return values.length === 1 && Observable.isObservable(values[0]);
        }
    }

    static anyUpdate(propertyValues) {
        return Array.isArray(propertyValues);
    }

    /**
     * Get all dependency properties for this property
     * @param {string} propertyName The name of this property
     * @param {[string] }dependencyModelNames The names for all the dependencies
     * @returns {[Observable]}
     */
    getDependencyProperties(propertyName, dependencyModelNames, defaultState) {
        var isLoop = (name)=> name === Constant.SELF_PROPERTY_NAME;
        var hasLoop = dependencyModelNames.filter(isLoop).length > 0;
        var resetTimeCounter = ()=> this.timeCounters.set(propertyName, 0);
        return (defaultState? [this.getStateDependencyProperty(propertyName, defaultState)] : []).concat(
            dependencyModelNames.map(name=>isLoop(name)?this.getIntDependencyProperty(propertyName): this.getExtDependencyProperty(name, hasLoop?resetTimeCounter:()=>{})));
    }

    getStateDependencyProperty(propertyName, defaultState) {
        let lastValue = pluck(this.documents.map(d=>pick(d, propertyName)), propertyName).filter(x=>!!x);
        return Observable.return(lastValue.length? lastValue: [defaultState]);
    }

    /**
     * Get the observable from the model map
     * @param {string} dependencyModelName
     * @param {function} afterHook A function which will be performed after the observable value changed
     * @returns {Observable}
     */
    getExtDependencyProperty(dependencyModelName, afterHook) {
        let [modelName, propName] = Util.parseDependencyString(dependencyModelName);
        let prop = ModelMap.get(modelName)[propName];
        return prop? prop.do(afterHook) : Error(null, Constant.ERROR_MSG.NO_PROPERTY_FOUND, dependencyModelName);
    }

    /**
     * Create a loop back subject for recursion
     * @param {string} propertyName
     * @returns {Rx.Subject}
     */
    getIntDependencyProperty(propertyName) {
        this.observables.set(propertyName, new BehaviorSubject());
        this.timeCounters.set(propertyName, 0);
        return this.observables.get(propertyName).observeOn(Scheduler.default);
    }

    findParents() {
        return values(this.computedProperties)
            .filter(x=>Array.isArray(x))
            .reduce((o,x)=>o.concat(x[1]),[])
            .filter(x=>x!==Constant.SELF_PROPERTY_NAME)
            .map(x=>Util.parseDependencyString(x)[0]) || [];
    }

    setupActionProxy() {
        let self = this;
        this.action = function(actionType) {
            return function(param) {
                self.startAction(actionType, param);
            };
        };
    }

    relayAction(actionType, param) {
        if(!ActionTracker.isVisited(this.name)) {
            ActionTracker.visit(this.name);
            this.parents.map(x=>ModelMap.get(x)).forEach(x=>x.relayAction(actionType, param));
        }
    }

    startAction(actionType, param) {
        ActionTracker.start();
        this.relayAction(actionType, param);
    }
}

export default StatelessModel;