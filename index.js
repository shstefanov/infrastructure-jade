//Plugin for infrastructure
var fs = require("fs");
var jade = require("jade");

var clientJavascript = fs.readFileSync(__dirname+"/client.js");

//Registering extension to require jade file
require.extensions['.jade'] = function(module, filename) {
  var raw_template = fs.readFileSync(filename, 'utf8').toString();
  module.exports = jade.compile(raw_template, {filename:filename});
};

module.exports = {
  config: function(config, callback){
    if(!config.bundleParse){config.bundleParse = {};}
    config.bundleParse['.jade'] = {
      parse: function(body, filepath){
      var raw_template = fs.readFileSync(filepath, 'utf8').toString();
      return jade.compile(raw_template, {client:true, filename:filepath}).toString();
      },
      prepend:"",
      append: "module.exports = anonymous;"
    }
    //setting up client javascript loading
    if(!config.defaultJavascripts){config.defaultJavascripts = []}
    config.defaultJavascripts.unshift("/core-libs/jade.js");
    callback(null, config);

    //Add parser for browserify
  },

  corescripts:["/core-libs/jade.js"],

  configure: function(express, app, config){

    //Set up view engine and views folder middleware here
    if(config.views){
      app.set('views', config.views);
      app.set('view engine', 'jade');
    }

    //Register jade client lib to the app core-libs
    app.get("/core-libs/jade.js", function(req, res, next){
      res.end(clientJavascript);
    });
  }
};
