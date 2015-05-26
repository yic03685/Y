var Y = require("../build/y");

Y.createModel("UserModel", {

    properties: {
        gridIndex: 0,
        categoryId: "someId"
    },

    computedProperties: {


    }

}, ["Kamaji"]);

Y.createCollection("CarouselCollection", {

    properties: {

        categoryId: "someId"

    },

    computedProperties: {

        pages: function(model, imports) {

            return model.categoryId
                .flatMap(_kamajiContainer)
                .flatMap(function(ls){
                    return RSVP.all(ls.map(x=>Kamaji.container))
                })
                .flatMap(passThru)
                .map(function(x){

                })


        }

    },

    create: function(model, imports) {

    }

}, ["UserModel"]);
