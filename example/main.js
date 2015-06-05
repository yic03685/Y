var Y = require("../build/y");
var _ = require("lodash");

Y.createModel({
    name: "GeomModel",
    properties: {
        x:0,
        y:0
    },
    actions: {
        move: function(param, document) {
            document.x = Math.random() * 200;
            document.y = Math.random() * 200;
        }
    }
});

Y.createModel({
    name: "SizeModel",
    properties: {
        width: 100,
        height: 100
    },
    actions: {
        move: function(param, document) {
            document.width = Math.random() * 200;
            document.height = Math.random() * 200;
        }
    }
});

window.model = Y.createModel({
    name: "RectModel",
    computedProperties: {
        left: function(model, GeomModel, SizeModel) {
            function postfix(x) {
                return ""+x+"px";
            }
            return {
                left: GeomModel.x.map(postfix),
                top: GeomModel.y.map(postfix),
                width: SizeModel.width.map(postfix),
                height: SizeModel.height.map(postfix)
            };
        }.require("GeomModel", "SizeModel"),

        top: "left",
        width: "left",
        height: "left"
    }
});


var rect = document.querySelector("#sampleRect");

Y.Observable.combineLatest(
    model.left, model.top, model.width, model.height, function(x,y,w,h) {
        return {left:x, top:y, width:w, height:h};
    }
).subscribe(function(geom){
   _.extend(rect.style, geom);
});

