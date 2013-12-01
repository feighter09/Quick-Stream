/*
//common
input general link
input X num
input file_output

//common
decide which logic to use
  switch case
  

//* different
generate X num of independent download requests
  different for each website
  two inputs: (gen_link), (X num)
  output: (array of download request)

//common
download each request simultaneously, and join to single file
  two input: (array of download request), (output_file)
  output: (void/status)

//common
output file.

*/

var http = require('http');
var URL = require('url');
var fs = require("fs");


var createDownloadRequest = function(options, start, end, total_size) {
  if (!options["headers"]) {
    options["headers"] = {};
  }
  options["headers"]["range"] = "bytes="+start+"-"+end+"";
  return options;
}

var startDownlods = function(fd, size_bytes, dl_reqs_arr) {
  var start = Math.floor(size_bytes/2);
  var end = Math.floor(size_bytes);
  for(var i=1; i<dl_reqs_arr.length; i++) {
    var dl_req = dl_reqs_arr[i];
    if (i == (dl_reqs_arr.length - 1)) start = 0;
    var options = createDownloadRequest(dl_req, start, end);
    downloadToFileAtPostion(fd, options, start, end, size_bytes);
    //update pointers
    end = Math.floor(start);
    start = Math.floor(start / 2);
  }
}
var downloadToFileAtPostion = function(fd, options, start, end) {
  http.request(options, function(res){
    var progress = 0;
    res.on('data', function (chunk) {
      var buffer_end = chunk.length;
      if (start+progress+buffer_end > end) buffer_end = end - (start+progress);
      fs.writeSync(fd, chunk, 0, buffer_end, start+progress);
      progress += buffer_end;
      if (start+progress >= end) res.destroy();
    });    
    res.on('end', function () {
      console.log("DONE ("+start+", "+end+")");
      res.destroy();
    });
  }).end();
}
var getDownloadFileSize = function(options, callback) {
  http.request(options, function(res) {
    var size = res.headers['content-length'] - 0;
    console.log("total length of file: "+size);
    callback(size);
    res.destroy();
  }).end();
}
var download_all = function(filename, dl_reqs_arr) {
  var dl_req = dl_reqs_arr.pop();
  getDownloadFileSize(dl_req, function(size) {
    var fd = fs.openSync(filename, 'w');
    startDownlods(fd, size, dl_reqs_arr);
  })
}


var url = "http://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_640x360.m4v";
var options = URL.parse(url);
var dl_reqs_arr = [
  options, options, options, options, options
]

module.exports.start_download = download_all

//download_all("video.m4v", dl_reqs_arr);


