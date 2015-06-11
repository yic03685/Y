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
        height: "left",
        backgroundColor: function(left, self, i) {
            var colorArray = ["red","blue","green","pink","yellow","black"];
            return i<5? Y.Observable.return(Y.Observable.return(colorArray[i]).delay(1000)) : Y.Observable.return(colorArray[i]);
        }.require("RectModel.left", "self")
    }
});

var rect = document.querySelector("#sampleRect");

model.left.subscribe(function(x){
    rect.style["left"] = x[0];
});
model.top.subscribe(function(x){
    rect.style["top"] = x[0];
});
model.width.subscribe(function(x){
    rect.style["width"] = x[0];
});
model.height.subscribe(function(x){
    rect.style["height"] = x[0];
});
model.backgroundColor.subscribe(function(x){
    console.log(x);
    rect.style["backgroundColor"] = x[0];
});







