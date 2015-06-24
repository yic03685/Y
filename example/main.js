var Y = require("../build/y");
var _ = require("lodash");
var $ = require("jquery");
//
//Y.createModel({
//    name: "PlayListModel",
//    properties: {
//        url: "https://api.spotify.com/v1/users/playstation_music/playlists",
//        response: function(url) {
//            return url.flatMap(function(x){
//                return $.ajax({
//                    url: x,
//                    headers: {
//                        "Authorization": "Bearer BQAOYNoDEn8cGGzXqfgNniP7G__Ry7Y8jdulwGScNu8Cs0RiMDAU3SSuDab6jtMwoEPxTmDBZ-2EFpQZwksZcg"
//                    }
//                });
//            })
//        }.require("PlayListModel.url")
//    }
//});
//
var playList = Y.createCollection({
    name: "PlayList",
    properties: {
        name: function(response) {

            return response;

        }.require("PlayListModel.response")
    },
    actions: {
        // action
        changeName: {
            name: function() {

            }
        }
    }
});

var rect = document.querySelector("#sampleRect");



