(function () {
	"use strict";

	/*
	myAssignedIssuesChecker = chrome.alarms.create({
		delayInMinutes: 0,
		periodInMinutes: .1
	});

	chrome.alarms.onAlarm.addListener(function (myAssignedIssuesChecker) {
		
	});
	//*/

	function checkMyIssues() {
		var ATLASSIAN_REST_API = "https://waytostay.atlassian.net/rest/api/2/",
			REQUEST_STRING = "search?jql=fixVersion+%3D+earliestUnreleasedVersion%28%22WTS%22%29+AND+%28assignee+%3D+currentUser%28%29+OR+assignee+is+EMPTY%29+AND+status+not+in+%28Closed%2C+Resolved%29+ORDER+BY+status%2C+priority%2C+assignee+DESC";

		var xhr = new XMLHttpRequest();
		xhr.open("GET", ATLASSIAN_REST_API + REQUEST_STRING, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var resp = JSON.parse(xhr.responseText);

				if (resp.errorMessages) {
					chrome.browserAction.setBadgeText({text: '!'});
					chrome.browserAction.setBadgeBackgroundColor({color: '#ff0000'});
				} else if (resp.total >= 1) {
					chrome.browserAction.setBadgeText({text: (resp.total + '')});
					chrome.browserAction.setBadgeBackgroundColor({color: '#5282d9'});
				}
			}
		};
		xhr.send();
	}

	setInterval(checkMyIssues, (1.5 * 60 * 1000));
	checkMyIssues();
}());