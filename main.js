var Novamov = require('./novamov_handler.js')
var Downloader = require('./downloader.js')

function main() {
	if (process.argv.length != 5)
	    throw "USAGE: node test <output_file> <num_streams> <video_url>"
	var OUTPUT_FILE = process.argv[2];
	var MAX_LINKS = process.argv[3] - 0;
	var VIDEO_URL = process.argv[4];

	var service_handler = false;
	if (VIDEO_URL.match(/novamov/)) {
		service_handler = Novamov;
	}

	if (!service_handler) throw new "Error, unimplemented service! url: " + VIDEO_URL;
	service_handler.generator(MAX_LINKS, VIDEO_URL, function(dl_reqs_arr) {
		Downloader.start_download(OUTPUT_FILE, dl_reqs_arr);
	});
}
main();


//http://embed.novamov.com/embed.php?v=008377a3b3ce9&height=&width=
//