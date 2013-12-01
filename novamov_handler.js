var promise = require('./promise.js')
var http = require('http');
var URL = require('url');
////////////////////////////////////
function generate_dl_req(base_url) {
	var p = new promise.Promise();
	simple_get_request(base_url)
	.then(function(err, data){
		return handle_first_to_second(data);
	})
	.then(function(err, data, json) {
		return handle_second_to_third(data, json);
	})
	.then(function(err, data){
		var dl_req = handle_final(data);
		p.done(null, dl_req);
	})
	return p;
}

////////////////////////////////////
var basic_handler = function (callback) {
	return function(response) {
	  var data = '';
	  response.on('data', function (chunk) {
	    data += chunk;
	  });
	  response.on('end', function () {
	    callback(data);
	  });
	  response.on('error', function () {
	    throw new "HTTP Download Error";
	  });
	}
}
var url_with_parameters = function(base_url, json) {
  var first = true;
  var query = "";
  for (var key in json) {
    var value = json[key];
    if (first) { query+="?"; first=false}
    else query += "&";
    query+= key + "=" + value;
  }
  return base_url + query
}
var simple_get_request = function (url) {
	var p = new promise.Promise();
	var options = URL.parse(url);
    http.request(options, basic_handler(function(data){
    	p.done(null, data);
    })).end();
    return p; 
}
var http_request = function (options) {
	var p = new promise.Promise(); 
    http.request(options, basic_handler(function(data){
    	p.done(null, data);
    })).end();
    return p; 
}


////////////////////////////////////
var parse_first_response = function(data) {
	var file_id = data.match(/flashvars.file=".*?";/)[0].substring(16).replace("\";", "");
	var file_key= data.match(/flashvars.filekey=".*?";/)[0].substring(19).replace("\";", "");;
	return {
		"file_id" : file_id,
		"file_key" : file_key
	};
}
var create_second_request = function (input_json) {
  var _file = input_json["file_id"];
  var _key = input_json["file_key"];
  if (!_file || !_key) {
    throw "need 'file' and 'key' params";
  }
  var base_url = "http://www.novamov.com/api/player.api.php";
  var json = {};
  json["file"] = _file;
  json["key"] =  _key;
  json["user"] = undefined; 
  json["pass"] = undefined; 
  json["cid"] = undefined;
  json["cid2"] = undefined;
  json["cid3"] = "free%2Dtv%2Dvideo%2Donline%2Eme";  
  json["numOfErrors"] = 0;
  var url = url_with_parameters(base_url, json);
  return URL.parse(url);
}
//ASYNC
var handle_first_to_second = function (data) {
	var p = new promise.Promise(); 
	var json = parse_first_response(data);
	var options = create_second_request(json);
    http.request(options, basic_handler(function(data){
    	p.done(null, data, json);
    })).end();
    return p; 
}


////////////////////////////////////
var parse_second_response = function(data) {
	var decoded = decodeURIComponent(data);
	var url = decoded.split("&")[0].substring(4)
	return url;
}
var create_third_request = function(input_json) {
	var _file = input_json["file_id"];
	var _key = input_json["file_key"];
	var _errorUrl = input_json["error_url"];
	if (!_file || !_key || !_errorUrl) {
	throw "need 'file' and 'key' and 'errorUrl' params";
	}
	var base_url = "http://www.novamov.com/api/player.api.php";
	var json = {};
	json["file"] = _file;
	json["key"] = _key;
	json["errorUrl"] = _errorUrl;
	json["user"] = undefined;
	json["pass"] = undefined;
	json["cid"] = undefined;
	json["cid2"] = undefined;
	json["cid3"] = "free%2Dtv%2Dvideo%2Donline%2Eme";
	json["numOfErrors"] = 1;
	json["errorCode"] = 404;
	var url = url_with_parameters(base_url, json);
	return URL.parse(url);
}
//ASYNC
var handle_second_to_third = function (data, json) {
	var p = new promise.Promise(); 
	var error_url = parse_second_response(data);
	json["error_url"] = error_url;
	var options = create_third_request(json);
    http.request(options, basic_handler(function(data){
    	p.done(null, data);
    })).end();
    return p; 
}

////////////////////////////////////
var parse_third_response = parse_second_response;
var handle_final = function (data) {
	var dl_url = parse_third_response(data);
	console.log(dl_url);
	return URL.parse(dl_url);
}


function gen_all_dl_req(num_req, base_url) {
	var p = new promise.Promise();
	var i = 0;
	var dl_reqs_arr = [];
	dl_req_gen_iterator(p, dl_reqs_arr, i, num_req, base_url);
	return p;
}
function dl_req_gen_iterator(main_promise, dl_reqs_arr, i, num_req, base_url) {
	generate_dl_req(base_url).then(function(err, dl_req){
		i++;
		dl_reqs_arr.push(dl_req);
		if (i < num_req) {
			dl_req_gen_iterator(main_promise, dl_reqs_arr, i, num_req, base_url);
		}
		else {
			main_promise.done(null, dl_reqs_arr);
		}
	});
}
function generator(num_req, base_url, callback) {
	gen_all_dl_req(num_req, base_url)
	.then(function(err, data){
		callback(data);
	});
}
//main(5, "http://embed.novamov.com/embed.php?v=f13203eea66a2&height=&width=", console.log);

module.exports.generator = generator;


/*

'\t\t\tflashvars.file="f13203eea66a2";',
  '\t\t\tflashvars.filekey="173.161.237.230-8988c1fb5eca5d807e0a26cd902ecd4e-";'
*/
