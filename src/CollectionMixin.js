/**
 * Created by ychen on 6/11/15.
 */
/**
 * Created by ychen on 6/11/15.
 */
import StatelessModel from "./StatelessModel";
import Observable from "./Observable";
import {zip, values, pick, set, isEqual, pluck} from "lodash";

export default {
    combineLatestToObject(keys) {
        return Observable.combineLatest.apply(null,
            values(pick(this, keys)).concat(function(){
                return zip.apply(null,(Array.from(arguments))).map((values)=>values.reduce((o,v,i)=>set(o,keys[i],v),{}));
            })
        );
    },
    makeAction(template) {
        return function(param){
            let documentsCopy = this.documents.slice(0);
            let newParams = template(param, documentsCopy);
            this.submitChanges(documentsCopy);
            return newParams;
        }.bind(this);
    },
    submitChanges(changedDocuments) {
        // only look at those properties that are not computed
        var self = this;
        Object.keys(this.properties).map(k=>[k,pluck(changedDocuments,k)]).forEach(info=>{
            let [key, values] = info;
            if(!isEqual(pluck(this.documents, key),values)) {
                self.output[key].onNext(values);
                self.documents.length = values.length;
                values.forEach((v,i)=> {
                    if(!self.documents[i]){
                        self.documents[i] = {};
                    }
                    self.documents[i][key] = v;
                });
            }
        });
        self.documents.slice(0, changedDocuments.length);
    }
};