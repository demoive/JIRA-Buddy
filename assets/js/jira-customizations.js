/*
 * WTS JIRA Customizations
 *
 * This file should be loaded into the "description" for the
 * Description and Comment fields of JIRA. It needs to be put into both of these so
 * that it is excecuted when an Issue is created (former) and when an Issue is resolved (latter).
 * Indeed, it will be executed twice on the default Issue viewing page.
 *
 * <script type="text/javascript" src="//sbs.waytostay.com/ITC/JIRA/wts-jira-customizations.js"></script>
 *
 * We used to be able to do this, but now we can't:
 * https://jira.atlassian.com/browse/JRA-27864
 * https://confluence.atlassian.com/display/JIRA/Fields+Allowing+Custom+HTML+or+JavaScript
 */

(function () {
	var AUDIO_PATH = chrome.extension.getURL("audio/"),
		closeButton = document.getElementById('action_id_701') || document.getElementById('action_id_2'),
		resolveButton = document.getElementById('action_id_5'),
		reopenButton = document.getElementById('action_id_3'),
		audioSrcBugle = {
			vol: .5,
			mp3: AUDIO_PATH + 'Sound-Effect_Bugle-Call.mp3',
			ogg: AUDIO_PATH + 'Sound-Effect_Bugle-Call.ogg'
		},
		audioSrcTrumpet = {
			vol: .2,
			mp3: AUDIO_PATH + 'Sound-Effect_Trumpet-Charge_short.mp3',
			ogg: AUDIO_PATH + 'Sound-Effect_Trumpet-Charge_short.ogg'
		},
		audioSrcLoser = {
			vol: .1,
			mp3: AUDIO_PATH + 'Sound-Effect_Loser.mp3',
			ogg: AUDIO_PATH + 'Sound-Effect_Loser.ogg'
		};

	/**/
	// sets the default value of the Description field.
	if (document.getElementById("description") && document.getElementById("description").value === "") {
		document.getElementById("description").value = "*How to reproduce*\n\n\n*Current behavior*\n\n\n*Expected behavior*\n";
	}
	/**/

	/**/
	// changes the label color of the "Post-deploy action" field to red when...
	if (document.getElementById("customfield_10400-val")) { // ...viewing an Issue
		document.getElementById("customfield_10400-val").previousElementSibling.style.color = "red";
	}
	setTimeout(function () {
		if (document.getElementById("customfield_10400")) { // ... creating/resolving and Issue (in the popup window)
			document.getElementById("customfield_10400").parentElement.parentElement.previousElementSibling.style.color = "red";
		}
	}, 100);
	// JIRA doesn't allow for HTML (including script tags) in the description for custom fields
	// so in case this field is located below the point where the script is inserted,
	// we wait for a small amount of time to allow for the DOM element to exist
	/**/

	/*
	 * Builds the following HTML snippet and appends it to the body:
	 *
	 * <audio autoplay>
	 *   <source src="MP3_AUDIO_SRC" type="audio/mpeg" />
	 *   <source src="OGG_AUDIO_SRC" type="audio/ogg" />
	 * </audio>
	*/
	function playSound(audioSrcObj) {
		var audioEl,
			audioSrcMP3El,
			audioSrcOGGEl;

		audioEl = document.createElement('audio');
		audioEl.volume = audioSrcObj.vol;
		audioEl.setAttribute('autoplay', '');

		audioSrcMP3El = document.createElement('source');
		audioSrcMP3El.setAttribute('src', audioSrcObj.mp3);
		audioSrcMP3El.setAttribute('type', 'audio/mpeg');

		audioSrcOGGEl = document.createElement('source');
		audioSrcOGGEl.setAttribute('src', audioSrcObj.ogg);
		audioSrcOGGEl.setAttribute('type', 'audio/ogg');

		audioEl.appendChild(audioSrcMP3El);
		audioEl.appendChild(audioSrcOGGEl);
		//audioEl.appendChild(document.createTextNode('Your browser does not support the audio element.'));

		// append the HTML snippet to the body of the document
		document.body.appendChild(audioEl);
	}

	/**/
	// attaches a listener to the "Close" button
	if (resolveButton) {
		resolveButton.addEventListener('click', function () {
			playSound(audioSrcBugle);
		}, false);
	}
	/**/

	/**/
	// attaches a listener to the "Close" button
	if (closeButton) {
		closeButton.addEventListener('click', function () {
			playSound(audioSrcTrumpet);
		}, false);
	}
	/**/

	/**/
	// attaches a listener to the "Close" button
	if (reopenButton) {
		reopenButton.addEventListener('click', function () {
			playSound(audioSrcLoser);
		}, false);
	}
	/**/

	/** /
	// Plays a sound when an issue is Closed
	// if the status is currently closed...
	if (false || document.getElementById('status-val') && document.getElementById('status-val').innerText.trim() === 'Closed') {
		var audioEl,
		    audioSrcMP3El,
		    audioSrcOGGEl,
		    now = new Date(),
		    closedDateString = document.getElementById('updated-date') && document.getElementById('updated-date').children[0].getAttribute('datetime'),
		    closedDate = closedDateString && (new Date(closedDateString));

		// if the current time is within 60 seconds of the last updated time...
		if ((now - closedDate) / 1000 <= (3600 * 8) ) {
			console.log("Issue Closed 'event' condition passed! Generating and appending code to play sound byte...");

			audioEl = document.createElement('audio');
			audioEl.setAttribute('autoplay', '');

			audioSrcMP3El = document.createElement('source');
			audioSrcMP3El.setAttribute('src', 'http://sbs.waytostay.com/ITC/Trumpet-Charge_short.mp3');
			audioSrcMP3El.setAttribute('type', 'audio/mpeg');

			audioSrcOGGEl = document.createElement('source');
			audioSrcOGGEl.setAttribute('src', 'http://sbs.waytostay.com/ITC/Trumpet-Charge_short.ogg');
			audioSrcOGGEl.setAttribute('type', 'audio/ogg');

			audioEl.appendChild(audioSrcMP3El);
			audioEl.appendChild(audioSrcOGGEl);
			//audioEl.appendChild(document.createTextNode('Your browser does not support the audio element.'));

			// append the HTML snippet to the body of the document
			document.body.appendChild(audioEl);
			console.log("Done. Sound should be loading/playing!");
		} else {
			console.log("Failed condition to play a sound on Issue Closed 'event'.");
		}
	}
	/**/

	/** /
	function executeOnWindowLoad() {
		if (document.getElementById('rowForcustomfield_10400')) {
			document.getElementById('rowForcustomfield_10400').children[0].children[0].style.color = "red";
		}

		// changes the label color of the "Post-deploy action required" field to red.
		//document.getElementById("customfield_10400").previousElementSibling.style.color="red";

		if (document.getElementById("customfield_10400")) {
			document.getElementById("customfield_10400").parentElement.parentElement.previousElementSibling.style.color="red";
		}

	}

	// attach function to window.onload event
	if (window.addEventListener) {
		window.addEventListener('load', executeOnWindowLoad, false);	// W3C
	} else {
	    window.attachEvent('onload', executeOnWindowLoad);	// IE
	}
	/**/

}());


/** /
// unable to use jQuery because it breaks JIRA
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
$(function () {

});
/**/
