//Plugin for infrastructure
var fs = require("fs");
var jade = require("jade");
var UglifyJS = require("uglify-js");


//Registering extension to require jade file

var lessCompiler;
var cssCompiler;
var javascriptCompiler;

module.exports = {
  config: function(config, callback){
    if(!config.bundlesOptions){config.bundlesOptions = {};}
    if(!config.bundlesOptions.parse){config.bundlesOptions.parse = {};}
    
    // Make parser to require jade templates clientside
    config.bundlesOptions.parse['.jade'] = function(body, filepath){
      var code =  jade.compile(fs.readFileSync(filepath, 'utf8').toString(), {
        client:true, 
        filename:filepath
      }).toString()
      .replace(/;/g, ";\n")
      .replace(/jade\.debug/g, "debug")
      .replace("function anonymous", "\n\nmodule.exports = function")
      .replace("debug = [{", "var debug = [{")
      .replace(/\n\n/g, "\n")
      .replace(/\n;\n/g, "\n");

      // https://github.com/mishoo/UglifyJS2
      if(!config.debug === true){
        var debug_stripped = code.replace(/(debug\.shift|debug\.unshift|jade\.rethrow).+;/gm, "");
        code = UglifyJS.minify(debug_stripped, {fromString: true}).code;
      }
      return code;
    }
    callback(null, config);
  },

  coreLibs: ["/core-libs/jade.js"],

  configure: function(express, app, config){

    // Make function to require jade templates serverside
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

    //Register jade client runtime to be accessible from browser

    var client_code = fs.readFileSync(__dirname+"/client.js").toString();
    if(!config.debug)
      client_code = UglifyJS.minify(client_code, {fromString: true}).code;
    
    app.get("/core-libs/jade.js", function(req, res, next){
      res.set('Content-Type', 'text/javascript');
      res.end(client_code);
    });
  },

};
