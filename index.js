//Plugin for infrastructure
var fs = require("fs");
var jade = require("jade");

var clientJavascript = fs.readFileSync(__dirname+"/client.js");

//Registering extension to require jade file

var lessCompiler;
var cssCompiler;
var javascriptCompiler;

module.exports = {
  config: function(config, callback){
    if(!config.bundleParse){config.bundleParse = {};}
    config.bundleParse['.jade'] = {
      parse: function(body, filepath){
        var raw_template = fs.readFileSync(filepath, 'utf8').toString();
        var compiled_string = jade.compile(raw_template, {
          debug:config.debug || false,
          client:true, 
          filename:filepath
        })
        .toString()
        .replace(/jade\.debug/g, "debug")
        .replace("debug = [{", "var debug = [{");
        return compiled_string;
      },
      prepend:"var debug;",
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

    require.extensions['.jade'] = function(module, filename) {
      var raw_template = fs.readFileSync(filename, 'utf8').toString();
      module.exports = jade.compile(raw_template, {filename:filename, debug:config.debug});
    };

    app.jade = jade;

    lessCompiler = require("./less-assets.jade");
    cssCompiler = require("./css-assets.jade");
    javascriptCompiler = require("./javascripts-assets.jade");

    //Set up view engine and views folder middleware here
    if(config.views){
      app.set('views', config.views);
      app.set('view engine', 'jade');
    }

    //Register jade client lib to the app core-libs
    app.get("/core-libs/jade.js", function(req, res, next){
      res.end(clientJavascript);
    });
  },

  assetRenderers: {
    javascripts: function(javascripts){
      return javascriptCompiler({javascripts:javascripts})+"\n\n";
    },
    styles: function(arr){
      var less = [];
      var css  = [];
      arr.forEach(function(style){
        var ext = style.split(".").pop();
        if(ext == "less"){ less.push(style); }
        if(ext = "css"){ css.push(style); }
      });
      return lessCompiler({less:less})+"\n\n"+cssCompiler({css:css});
    }
  }
};
