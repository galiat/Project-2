//These are the elements that get updated based on timeFraction
var hashtagPlot = document.getElementById('hashtag-plot');
var transcript = document.getElementById('sotu-transcript');
var scrubBar = document.getElementById('scrub-bar');
var SOTUvideo = document.getElementById('sotu-video');
var videoOffset = 306;
SOTUvideo.muted = true;

// Pull out all the transcript timestamps for use throughout
var timestamps = extractTimestamps();
function extractTimestamps() {
	var timestamps = [];
	var stampedDivs = transcript.querySelectorAll('div');
	for (var i = 0; i < stampedDivs.length; i++) {
		timestamps[i] = parseInt(stampedDivs[i].id.split('-')[2], 10);
	}
	return timestamps;
}

// Initialize these for loading later, after window.onload
var nation = null;
var statePaths = null;
var stateAbbreviations = [];

// Hardcoded colors for each hashtag, grabbed from the twitter site with https://en.wikipedia.org/wiki/DigitalColor_Meter
var hashtagColors = {
	"energy": "rgb(50,160,44)",
	"jobs": "rgb(255,127,0)",
	"education": "rgb(178,223,138)",
	"fairness": "rgb(252,154,153)",
	"healthcare": "rgb(227,25,27)",
	"defense": "rgb(30,120,180)",
};

	// Hardcoded by looking at the plot--
	var dominantHashtags = [
		[1266, 'energy'],
		[1615, 'jobs'],
		[1861, 'education'],
		[2124, 'fairness'],
		[2681, 'healthcare'],
		[3592, 'defense']
	];

////////////////////////////////////////////////////////////////////////////////
// initialize window
window.onload = function () {
	// We have to make sure that we have the nation and the states
	// But because of the size and loading time of the SVG, we have to attach it to an event handler for window.onload to make sure it's fully loaded
	//nation = document.getElementsByTagName('object')[0].contentDocument.getElementsByTagName('svg')[0];
	nation = document.getElementsByTagName('svg')[0];
	statePaths = nation.querySelectorAll('.state');

	// Go through and get all the state abbreviations used
	stateAbbreviations = [];
	for (var i = 0; i < statePaths.length; i++ ) {
		if (statePaths[i].id.length == 2) {
			stateAbbreviations.push(statePaths[i].id);
		}
	}
	updateMap(); // This is where the action happens: recolor the states for the current time of the video.
};

////////////////////////////////////////////////////////////////////////////////
// Add listeners

// Run hashtagMousemove every time the mouse moves above the hashtagPlot
hashtagPlot.addEventListener('mousemove', hashtagMousemove, false);
function hashtagMousemove(e) {
	//console.log('hashtagMousemove');
	mousePosition = e.clientX; //e.clientX is the mouse position
	timeFraction = (mousePosition - position(hashtagPlot).x)/hashtagPlot.offsetWidth;
  updateTranscript(timeFraction, true);
  updateVideo(timeFraction);
  updateScrubBar(timeFraction);
	updateMap();
	updateChart();
}

hashtagPlot.addEventListener('mouseout', playVideo, false);
function playVideo(e) {
	//console.log('playVideo');
	SOTUvideo.play();
}

// transcript.addEventListener('mouseout', playVideo, false);
// function playVideo(e) {
// 	SOTUvideo.play();
// }

// Adding the nav functionality for the video
var hashtagNav = document.getElementsByTagName('li');
for (var i = 0; i < hashtagNav.length; i++) {
	hashtagNav[i].addEventListener('click', navClick, false);
}
function navClick(e) {
	//console.log('navClick');
	var timestamp = parseInt(this.getAttribute('data-timestamp'), 10);
	timeFraction = (timestamp-videoOffset)/SOTUvideo.duration;
	updateScrubBar(timeFraction);
  updateTranscript(timeFraction, true);
  updateVideo(timeFraction);
	updateMap();
	updateChart();
}

// Set up the video so that the chart is updated and the nation recolored every time the time changes
SOTUvideo.addEventListener("timeupdate", videoPlay);
function videoPlay(e){
	//console.log('videoPlay');
  var timeFraction = SOTUvideo.currentTime/SOTUvideo.duration;
  updateScrubBar(timeFraction);
  updateTranscript(timeFraction, true);
	updateMap();
	updateChart();
}

//transcript.addEventListener("click", transcriptClick, false);
// function transcriptClick(e){
// 	if(e.target.tagName == "P"){
// 	  //0 to 17470
// 	  //var timeFraction = transcript.scrollTop/17470;
// 	  //SOTUvideo.pause();
//     var timestampNumber = parseInt(e.target.parentNode.id.split('-')[2]);
//     var timeFraction = (timestampNumber - videoOffset)/SOTUvideo.duration
// 	  updateVideo(timeFraction);
// 	  updateScrubBar(timeFraction);
// 		updateTranscript(timeFraction, false);
// 	 	updateMap();
// 	  updateChart();
//   }
//  }


////////////////////////////////////////////////////////////////////////////////
//
transcript.addEventListener('click', clickInsertTimestamp, false);
function clickInsertTimestamp(e){
  if(e.target.tagName == 'P'){
  	insertTimestamp(e.target);
  }
}

function insertTimestamp(paragraph){
	// If its the first paragraph in the div, it already has a timestamp
	// Also, it needs to be the in the current timestamp div.

	if (paragraph.parentNode.firstElementChild != paragraph && paragraph.parentNode.className == 'current-timestamp'){
		//console.log('creating new timestamp');
		timestampNumber = Math.round(SOTUvideo.currentTime);
		paragraph.parentNode.insertAdjacentHTML('afterend', "<div id='transcript-time-" + timestampNumber+ "'></div>");
		new_div = document.getElementById("transcript-time-" + timestampNumber);
		//console.log(new_div);
		var moveParagraph = false;
		var children = paragraph.parentNode.children; //the set of children is altered in the loop, so we need to cache it
		for(var i =0; i < children.length; i++){
			//console.log('children.length ' + children.length);
			var current_paragraph = children[i];
			//console.log(current_paragraph);
			if(paragraph == current_paragraph){
				//console.log('paragraph == current_paragraph');
				moveParagraph = true;
			}
			if(moveParagraph){
				//console.log('moving ' + current_paragraph.innerText);
				new_div.appendChild(current_paragraph);
				i = i-1; //because we moved it, all child elements shifted
			}
			//console.log('children.length ' + children.length);

		}

    //TODO. change the highlighing
		//TODO c&p
		// var currentTimestamp = new_div;
		// var higlightedTimestamp = transcript.getElementsByClassName('current-timestamp')[0];
		// if (currentTimestamp != higlightedTimestamp){
		// 	console.log('change style');
		//   higlightedTimestamp.className = "";
	  //    currentTimestamp.className += "current-timestamp";
	  //  }

	}

}

////////////////////////////////////////////////////////////////////////////////
// Update screen functions

function updateScrubBar(timeFraction) {
	scrubBar.style.visibility = 'visible';
	scrubBar.style.left = timeFraction * hashtagPlot.offsetWidth;
}

function updateVideo(timeFraction) {
	SOTUvideo.currentTime = SOTUvideo.duration * timeFraction;
}

function updateTranscript(timeFraction, move) {
	var currentTimestampNumber = nearestStamp(timeFraction);
	var currentTimestampId = "transcript-time-" + currentTimestampNumber;
	var currentTimestamp = document.getElementById(currentTimestampId);
	var higlightedTimestamp = transcript.getElementsByClassName('current-timestamp')[0]; // there can be only one. TODO maybe make this more robust later

	//if (move){
		//transcript.scrollTop = timeFraction * 17470
		//transcript.scrollTop =currentTimestamp.offsetTop - 340; //TODO hieght of transcrip
    //scrollToTimestamp(currentTimestampNumber);
  //}


	if (currentTimestamp != higlightedTimestamp){
		if (move) {
		  scrollToTimestamp(currentTimestampNumber);
	  }
	  higlightedTimestamp.className = "";
    currentTimestamp.className += "current-timestamp";
  }

}

//Note: Uses SOTUvideo.currentTime global
function updateMap() {
	hashtag = dominantHashtagAt(SOTUvideo.currentTime);
	// A function to go through every state and color it correctly for a given hashtag

	// for ( var k = 0; k < stateAbbreviations.length; k++ ) {
	// 	var stateAbbreviation = stateAbbreviations[k];
	// 	var state = nation.getElementById(stateAbbreviation);
	// 	colorState(state, getIntervalAt(SOTUvideo.currentTime), hashtag);
	// }

  var map = d3.select("#map").select('svg');
  map.selectAll(".state")
      .data(stateAbbreviations)
      .style("fill", hashtagColors[hashtag])
      .style("opacity", function(stateAbbrev, i){return stateOpacity(stateAbbrev, getIntervalAt(SOTUvideo.currentTime), hashtag)});


}

//Note: Uses SOTUvideo.currentTime global
function updateChart() {
	// Now that we have all the needed data, actually redraw the chart

	var currentInterval = getIntervalAt(SOTUvideo.currentTime); //currentInterval is the data from twitter for whatever is the closest time interval
	var numbers = document.querySelectorAll('#hashtag-chart li div.bar'); // Get all the bar chart divs

	var rawTotals = {};
	for (var i = 0; i < numbers.length; i++) {
		// Total engagement for a given hashtag across the nation
		                                                               //numbers[i].id is 'energy', 'job' etc
		rawTotals[numbers[i].id] = getTotalEngagement(currentInterval, numbers[i].id);
	}

	// Figure out the range of engagement
	var maxEngagement = 0;
	var totalEngagement = 0;
	for ( var eachHashtag in rawTotals ) {
		maxEngagement = Math.max(maxEngagement, rawTotals[eachHashtag]);
		totalEngagement += rawTotals[eachHashtag];
	}

	// For each hashtag, calculate how to scale the bars so that the largest is '1'
	for (var hashtag in rawTotals) {
		var newWidth = interpolate(rawTotals[hashtag], [0, maxEngagement], [0,1])*65 + '%';
		var bar = document.querySelector('li div#' + hashtag);
		bar.style.width = newWidth;

		// Color the dominant hashtag, make the rest gray
		var sibling = null; // Holds the text next to each bar
		if (hashtag == dominantHashtagAt(SOTUvideo.currentTime)) {
			bar.style.backgroundColor = hashtagColors[hashtag];
			sibling = bar.parentNode.getElementsByClassName('hashtag')[0];
			sibling.style.color = hashtagColors[hashtag];
		}
		else {
			sibling = bar.parentNode.getElementsByClassName('hashtag')[0];
			sibling.style.color = '#d3d3d3';
			bar.style.backgroundColor = '#d3d3d3';
		}

	}
}

//////////////////////////////////////////
// Other stuff

function dominantHashtagAt(time) {
	// A function to figure out the dominant hashtag at a given time

	// Go backwards through the hashtags looking for the first which predates the time we're looking for
	var dominantHashtag = null;
	for ( var j = dominantHashtags.length - 1; j >= 0; j-- ) {
		var timestamp = dominantHashtags[j][0];
		var hashtag = dominantHashtags[j][1];
		timestamp -= videoOffset;

		if (time > timestamp) {
			return hashtag;
		}
	}

	// Otherwise, if going backwards hasn't found one that's before the time we're looking for, return the first
	return dominantHashtags[0][1];
}

function getIntervalAt(seconds) {
	// A function to get the nearest Interval we have from twitter for a given time
	return UTCtoNearestAvailableIntervalData(videoTimeToUTC(seconds));
}

function UTCtoNearestAvailableIntervalData(UTCdate) {
	// Go from a UTC date/time to the nearest available Interval we have from twitter

	// Get all the tweetIntervals from the tweetValues we loaded from values.json
	var tweetIntervals = Object.keys(tweetValues);
	for (var i = 0; i < tweetIntervals.length; i++) {
		// Tweets are indexed by interval (e.g. 2014-01-29 02:15:::2014-01-29 02:15), and we just want the start of the interval
		var tweetIntervalStart = new Date(tweetIntervals[i].split(':::')[0]);
		// As we go through, check if the time we just converted is after the time we're looking fo
		if (UTCdate < tweetIntervalStart) {
			return tweetValues[tweetIntervals[i-1]];
		}
	}
}

function videoTimeToUTC(seconds){
	// From a certain number of seconds after the SOTU started, get the absolute time in UTC
	var SOTUstart = new Date(2014, 0, 28, 21, 15, 0); // the date of the SOTH
	UTCOffset = 5*60*60; // in seconds
	return new Date(SOTUstart.getTime() + 1000*(UTCOffset + seconds)); // *1000 b/c Date expects milliseconds
}

function stateOpacity(stateAbbrev, interval, hashtag) {
	// A function to color a given state, at a given interval, for a given hashtag
	opacity = 0.1; // Default to 10% opacity

	if (Object.keys(interval).indexOf(stateAbbrev) != -1) { // If a state was sufficiently engaged in this interval to have data
		var range = engagementRange(interval, hashtag); // Figure out the max and min of engagement overall so we can color proportionally
		var stateEngagements = interval[stateAbbrev]; // And then pull out this one state's engagements with different hashtags

		for (var i = 0; i < stateEngagements.length; i++) { // Iterate over the hashtags
			if ( stateEngagements[i][0] == '#' + hashtag ) { // And when we find the one we're coloring for
				var myEngagement = parseFloat(stateEngagements[i][1], 10);
				var newOpacity = interpolate(myEngagement, range, [0.1,1]);
				// return the opacity to be proportional to our state's relative engagement
				return newOpacity; // and stop iterating
			}
		}
	}
	return opacity;
}

function engagementRange(interval, hashtag) {
	// A function getting the min (range[0]) and max (range[1]) engagement for a given hashtag in a given interval across the country
	var range = [0,0];
	for ( var state in interval ) {
		var stateData = interval[state];
		for ( var i = 0; i < stateData.length; i++ ) {
			if ('#' + hashtag == stateData[i][0]) {
				var frequency = stateData[i][1];
				range[0] = Math.min(range[0], frequency);
				range[1] = Math.max(range[1], frequency);
			}
		}
	}

	return range;
}

function getTotalEngagement(interval, hashtag) {
	//console.log(interval);
	// A function to sum up total engagement so we can plot things proportionally
	var sum = 0;
	for ( var state in interval ) {
		var stateData = interval[state];
		for ( var i = 0; i < stateData.length; i++ ) {
			if ('#' + hashtag == stateData[i][0]) {
				sum += stateData[i][1];
			}
		}
	}

	return sum;
}

function videoTime(timeFraction){
  return timeFraction * SOTUvideo.duration;
}

////////////////////////////////////////////////////////////////////////////////
// Transcript Helper Functions

function scrollToTimestamp(timestamp) {
	var target = transcript.querySelector('#transcript-time-' + timestamp);
	transcript.scrollTop = target.offsetTop - 340; //TODO hieght of transcript
}

function nearestStamp(fractionScrubbed) {
	// Figure out what the closest timestamp we have is to the current amount of scrubbing
	var timestampEquivalent = fractionScrubbed * SOTUvideo.duration + videoOffset; // IF we had a timestamp, what would it be?
	for (var i = 0; i < timestamps.length - 1; i++) {
		if ( timestamps[i+1] > timestampEquivalent ) { // Find teh first timestamp our guess is greater than
			return timestamps[i];
		}
	}
	return timestamps[timestamps.length - 1];
}


////////////////////////////////////////////////////////////////////////////////
// Utility functions

function position(element) {
	// A function which takes an element and returns a dictionary with its x and y position
    for (var lx=0, ly=0;
         element !== null;
         lx += element.offsetLeft, ly += element.offsetTop, element = element.offsetParent);

    return {x: lx, y: ly};
}

function interpolate(value, from, to) {
	// A function that lets us scale a value from one scale to another-- e.g. 5 : [0, 10] to 0.5 for [0, 1]
	var fromSpread = from[1] - from[0];
	var toSpread = to[1] - to[0];

	var ratio = toSpread/fromSpread;

	return (value - from[0])*ratio + to[0];
}