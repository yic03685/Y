import StatelessModel from "./StatelessModel";
import {Subject, BehaviorSubject} from "rx";
import Capture from "./Capture";
import ModelMap from "./ModelMap";
import {values} from "lodash";
import ActionTracker from "./ActionTracker";

class Model extends StatelessModel {

    constructor(name, properties, computedProperties, actions) {
        this.properties = properties;
        this.documents = [];
        this.output = {};
        this.setupProperties();
        super(name, computedProperties);
        this.setupActions(actions);
    }

    setupProperties() {
        let self = this;
        Object.keys(this.properties).forEach(function(key) {
            self.output[key] = new BehaviorSubject();
            Object.defineProperty(self, key, {
                get: function(){
                    return self.output[key]
                },
                set: (val) => self.changeProperty(key, val)
            });
            self[key] = self.properties[key];
        });
    }

    changeProperty(key, value) {
        this.applyValueToProperty(key, value);
        this.output[key].onNext(value);
    }

    setupActions(actionTemplates={}) {
        this.availableActions = Object.keys(actionTemplates)
            .map(k=>[k, this.makeAction(actionTemplates[k])])
            .reduce((o, info)=>{
                let [key, value] = info;
                o[key] = value;
                return o;
            },{});
    }

    makeAction(template) {
        return function(param){
            let documentClones = Object.assign({}, this.documents);
            let newParams = template(param, documentClones);
            this.submitChanges(documentClones);
            return newParams;
        }.bind(this);
    }

    relayAction(actionType, param) {
        if(!ActionTracker.isVisited(this.name)) {
            ActionTracker.visit(this.name);
            let newParam = this.availableActions[actionType]? this.availableActions[actionType](param) : param;
            this.parents.map(x=>ModelMap.get(x)).forEach(x=>x.relayAction(actionType, newParam));
        }
    }

    submitChanges(changedDocument) {
        // only look at those properties that are not computed
        Object.keys(this.properties).map(k=>[k,changedDocument[k]]).forEach(info=>{
            let [key, value] = info;
            if(this.document[key] !== value) {
                this.output[key].onNext(value);
                this.document[key] = value;
            }
        });
    }


}

export default Model;