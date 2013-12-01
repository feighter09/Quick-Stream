Quick-Stream
============

Open multiple connections to a single video to stream it many times faster. 


## Dependencies
Node.js

## Usage
- Go to a site like http://www.free-tv-video-online.me/ and find a video you would like to watch. 
- Click on a link to video from a supported service (currently only novamov is supported)
  - If using the above site, you should be on a page with a URL like "http://www.free-tv-video-online.me/player/novamov.php?id=008377a3b3ce9"
- Find the actual url of the video
  - You can do this by typing "java~script:alert(document.getElementsByTagName('iframe')[0].attributes.src.value)" into your address bar, removing the "~" in "java~script" and pressing enter.
  - This url should be in the form "http://embed.novamov.com/embed.php?v=008377a3b3ce9&height=&width="
- navigate to the QuickStream folder and run the app using 'node   main   output-file   num-streams   video_url';
- wait a few seconds for the video to load a bit, and then use VLC to play the file you are downloading. 

## Sample
node main community_s01e07.flv 5 "http://embed.novamov.com/embed.php?v=008377a3b3ce9&height=&width="
