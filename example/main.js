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
    properties: {
        left: function(x, y, width, height) {
            function postfix(x) {
                return ""+x+"px";
            }
            return {
                left: x.map(postfix),
                top: y.map(postfix),
                width: width.map(postfix),
                height: height.map(postfix)
            };
        }.require("GeomModel.x", "GeomModel.y", "SizeModel.width", "SizeModel.height"),
        top: "left",
        width: "left",
        height: "left"
    }
});

var rect = document.querySelector("#sampleRect");

model.observeAll().subscribe(function(x){
   _.extend(rect.style, x);
});



