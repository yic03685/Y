import Rx from "rx";
import Observable from "./Observable";
import StatelessModel from "./StatelessModel";
import Model from "./Model";
import ModelMap from "./ModelMap";

function isStatelss(tmpl) {
    return !tmpl.properties;
}

class Y {

    static createModel(template) {
        var model = isStatelss(template)? new StatelessModel(template.name, template.computedProperties):
            new Model(template.name, template.properties, template.computedProperties, template.actions);
        ModelMap.add(model.name, model);
        return model;
    }
}


Object.defineProperty(Y, "Observable", {
   get: ()=> Observable
});

export default Y;