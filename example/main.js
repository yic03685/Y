var Y = require("../build/y");

Y.create("UserModel", {
    setup: function(imports) {
        this.isLogIn = imports["AppModel"].status;

    }
}, ["AppModel"]);

Y.observe("UserModel").select(x=>x.name==="yi").observe("PostModel").sort((x,y)=>x.length-y.length).content.subscribe(x=>console.log(x));

Y.update("UserModel").select(x=>x.name==="yi").action();


Y.create("DealModel", {

    setup: function(imports, model) {

        model.categoryId = "";



    }

});