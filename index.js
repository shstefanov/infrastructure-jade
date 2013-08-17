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
    if(!config.bundlesOptions.parse){config.bundlesOptions.parse = {};}
    config.bundlesOptions.parse['.jade'] = function(body, filepath){
      return jade.compile(fs.readFileSync(filepath, 'utf8').toString(), {
        debug:config.debug || false,
        client:true, 
        filename:filepath
      })
      .toString()
      .replace(/jade\.debug/g, "debug")
      .replace("jade.rethrow", "jade.runtime.rethrow")
      .replace("function anonymous", "\n\nmodule.exports = function")
      .replace("debug = [{", "var debug = [{")+";\nconsole.log(module.exports());";
    }
    callback(null, config);
  },

  coreLibs: ["/core-libs/jade.js"],

  configure: function(express, app, config){

    require.extensions['.jade'] = function(module, filename) {
      var raw_template = fs.readFileSync(filename, 'utf8').toString();
      module.exports = jade.compile(raw_template, {filename:filename, debug:config.debug});
    };

    app.jade = jade;

    //Set up view engine and views folder middleware here
    if(config.views){
      app.set('views', config.views);
      app.set('view engine', 'jade');
    }

    //Register jade client lib to the app core-libs
    app.get("/core-libs/jade.js", function(req, res, next){
      //FIXME - add mime type here
      res.end(clientJavascript);
    });
  },

};
