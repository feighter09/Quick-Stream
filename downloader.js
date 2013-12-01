var http = require('http');
var URL = require('url');
var fs = require("fs");

var PM = null;
//////////
var createDownloadRequest = function(options, start, end, total_size) {
	if (!options["headers"]) {
		options["headers"] = {};
	}
	options["headers"]["range"] = "bytes="+start+"-"+end+"";
	return options;
}
/////////
var download_all = function(filename, dl_reqs_arr, est_watch_time) {
	var dl_req = dl_reqs_arr.pop();
	getDownloadFileSize(dl_req, function(size) {
		PM = new progress_monitor(size, est_watch_time)
		var fd = fs.openSync(filename, 'w');
		startDownlods(fd, size, dl_reqs_arr);
	})
}
var getDownloadFileSize = function(options, callback) {
	http.request(options, function(res) {
		var size = res.headers['content-length'] - 0;
		console.log("total length of file: "+size);
		callback(size);
		res.destroy();
	}).end();
}
var startDownlods = function(fd, size_bytes, dl_reqs_arr) {
	var start = Math.floor(size_bytes/2);
	var end = Math.floor(size_bytes);
	var dl_queue = [];
	PM.start_reporting();
	if (dl_reqs_arr.length == 1) {
		var dl_req = dl_reqs_arr[0];
		var options = createDownloadRequest(dl_req, start, end);
		downloadToFileAtPostion(fd, options, start, end, size_bytes);
		return;
	}

	for(var i=0; i<dl_reqs_arr.length; i++) {
		var dl_req = dl_reqs_arr[i];
		if (i == (dl_reqs_arr.length - 1)) start = 0;
		var options = createDownloadRequest(dl_req, start, end);
		dl_queue.push(options);
		//downloadToFileAtPostion(fd, options, start, end, size_bytes);
		//update pointers
		end = Math.floor(start);
		start = Math.floor(start / 2);
	}
	for (var i = dl_queue.length - 1; i >= 0; i--) {
		var options = dl_queue[i];
		downloadToFileAtPostion(fd, options, start, end, size_bytes);
	};
}
var downloadToFileAtPostion = function(fd, options, start, end) {
	var dl_id = "from"+start;
	PM.add_entry(dl_id, end-start);
	http.request(options, function(res){
		var progress = 0;
		res.on('data', function (chunk) {
			var buffer_end = chunk.length;
			if (start+progress+buffer_end > end) {
				buffer_end = end - (start+progress);
			}
			fs.writeSync(fd, chunk, 0, buffer_end, start+progress);
			progress += buffer_end;
			//track progress
			PM.update(dl_id, progress);
			//stop if exceded limit
			if (start+progress >= end) {
				res.destroy();
			}
		});
		res.on('end', function () {
			console.log("DONE ("+start+", "+end+")");
			res.destroy();
		});
	}).end();
}
//////////
var progress_monitor = function(total_size, est_watch_time) {
	var _this = this;
	_this.total_size = total_size;
	_this.est_watch_time = est_watch_time * 60; //to make it seconds
	_this.reporter = null;
	_this.conn = {};
	_this.add_entry = function(conn_id, seg_size) {
		_this.conn[conn_id] = _this.create_prog_record(seg_size);
	}
	_this.update = function(conn_id, curr_prog) {
		if (!_this.conn[conn_id]) {
			throw new "Error cannot add to empty entry!";
		} else {
			_this.conn[conn_id]["curr_prog"] = curr_prog;
			_this.conn[conn_id]["last_updated"] = (new Date())*1;
		}
	};
	_this.create_prog_record = function(seg_size) {
		return {
			"curr_prog": 0,
			"seg_size": seg_size,
			"start_time": (new Date())*1,
			"last_updated": (new Date())*1,
		};
	};
	_this.get_speed = function(conn_id) {
		var prog_listing = _this.conn[conn_id];
		var d_time = prog_listing["last_updated"] - prog_listing["start_time"]
		var curr_prog = prog_listing["curr_prog"];
		if (curr_prog == 0) return -1;
		var raw_speed = curr_prog / d_time; //bytes per ms
		var conv_factor = (1000 / 1024);
		var mb_p_s = raw_speed * conv_factor;
		return mb_p_s;
	}
	_this.get_avg_speed = function() {
		var count = 0;
		var total_speed = 0;
		for (var id in _this.conn) {
			count++;
			total_speed+= _this.get_speed(id);
		}
		var avg_mb_p_s = total_speed / count;
		return avg_mb_p_s;
	}
	_this.start_reporting = function() {
		_this.reporter = setInterval(function(){
			console.log("tick");
			var first_conn_id = "from0";
			var prog_listing = _this.conn[first_conn_id];
			if (!prog_listing) return;
			var first_conn_speed = _this.get_speed(first_conn_id);
			if (first_conn_speed <= 0) return;
			var curr_prog = prog_listing["curr_prog"];
			var seg_total = prog_listing["seg_size"];
			//simple var names for math
			var E = seg_total;
			var d = (first_conn_speed * 1024 / 1000);
			var t = _this.est_watch_time;
			var s = _this.total_size;
			var w = curr_prog;
			console.log(E, d, t, s, w);
			var est_seg_total = w * (1 + (t * d) / s); 
			if (est_seg_total >=  seg_total) {
				console.log(">> you may begin watching!");
				_this.stop_reporting();
			} else {
				var target_prog = (E*s) / (t*d + s);
				var d_prog = target_prog - curr_prog;
				var t_ms = d_prog / d;
				var t_sec = t_ms / 1000;
				var t_min = t_sec / 60;
				if (t_min > 1) {
					console.log("still need to wait "+t_min+" minute(s)");
				} else {
					console.log("almost there! just "+t_sec+" second(s) !!");
				}
			}
		}, 5000);
	};
	_this.stop_reporting = function() {
		clearInterval(_this.reporter);
	};
}

module.exports.start_download = download_all

//download_all("video.m4v", dl_reqs_arr);