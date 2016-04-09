var Transform = require('stream').Transform;
var util = require( "util" );
var fs = require("fs");
var program = require("commander");

if (!Transform) {
Transform = require('readable-stream/transform');
}

//From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string){
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function PatternMatch(pattern) {
Transform.call(this, {objectMode: true});
this._remainder = "";
this._pattern = new RegExp("(.*?)" + escapeRegExp(pattern) + "(.*)", "i");
}
// Extend the Transform class.
util.inherits(PatternMatch, Transform);

// Implement _transform method.
PatternMatch.prototype._transform = function (chunk, encoding, getNextChunk){
  this._remainder += chunk;
  
  var match = this._remainder.match(this._pattern);

  while (match) {
    this.push(match[1].trim());
    this._remainder = match[2];
    match = this._remainder.match(this._pattern);
  }

  getNextChunk();
}

//After stream has been read and transformed, the _flush method is called. It is a great
//place to push values to output stream and clean up existing data
PatternMatch.prototype._flush = function (flushCompleted) {
  if (this._remainder.length > 0) {
//    Example Output does not print the remainder once input has finished.
//    this.push(this._remainder.trim());
  }
  flushCompleted();
}

//That wraps up patternMatch module.
//Program module is for taking command line arguments
program
.option('-p, --pattern <pattern>', 'Input Pattern such as . ,')
.parse(process.argv);
// Create an input stream from the file system.
var inputStream = fs.createReadStream( "input-sensor.txt" );
// Create a Pattern Matching stream that will run through the input and find matches
var patternStream = inputStream.pipe( new PatternMatch(program.pattern));
var matches = []; 
//Read matches as they occur and save them.
patternStream.on("readable", function() {
  var match = null;
  while (match = this.read() ) {
    matches.push(match);
  }
}
);
//When all matches are complete, write them to output.
patternStream.on("end", function() {
  console.log(matches);
});

