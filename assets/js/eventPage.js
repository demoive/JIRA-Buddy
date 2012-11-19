var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-36256238-3']);
_gaq.push(['_trackPageview']);

(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


"use strict";

var jiraBuddyCRX = {


	init: function () {
		// first thing needed is the account ID (to build the URLs)
		
		// get general server info
		this.getServerInfo();
		this.restAuthenticate();
		this.getProjectInfo();

		setInterval(this.checkMyIssues, (1.5 * 60 * 1000));
		this.checkMyIssues();
	},


	getProjectInfo: function () {
		var REQUEST_STRING = "project",
			xhr = new XMLHttpRequest();

		xhr.open("GET", this.getAtlassianRestAPI() + REQUEST_STRING, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4) {
				//var resp = JSON.parse(xhr.responseText);
				window.localStorage.setItem('JIRA_ACCOUNT_PROJECTS', xhr.responseText);
			}
		};
		xhr.send();
	},


	restAuthenticate: function () {
		var REQUEST_STRING = "serverInfo",
			xhr = new XMLHttpRequest();

		xhr.open("GET", "https://waytostay.atlassian.net/rest/auth/1/session", true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4) {
				var resp = JSON.parse(xhr.responseText);

				if (resp.errorMessages) {
					// not logged in!
					console.error("not logged in");

					window.localStorage.removeItem('JIRA_USER_NAME');
					window.localStorage.removeItem('JIRA_USER_EMAIL');
					window.localStorage.removeItem('JIRA_USER_AVATAR');

					window.localStorage.removeItem('JIRA_USER_LOGIN_NAME');
					window.localStorage.removeItem('JIRA_USER_LOGIN_PREVIOUS');
					window.localStorage.removeItem('JIRA_USER_LOGIN_COUNT');
					window.localStorage.removeItem('JIRA_USER_LOGIN_FAILED_PREVIOUS');
					window.localStorage.removeItem('JIRA_USER_LOGIN_FAILED_COUNT');

				} else {
					window.localStorage.setItem('JIRA_USER_LOGIN_NAME', resp.name);
					window.localStorage.setItem('JIRA_USER_LOGIN_PREVIOUS', resp.loginInfo.previousLoginTime);
					window.localStorage.setItem('JIRA_USER_LOGIN_COUNT', resp.loginInfo.loginCount);
					window.localStorage.setItem('JIRA_USER_LOGIN_FAILED_PREVIOUS', resp.loginInfo.lastFailedLoginTime);
					window.localStorage.setItem('JIRA_USER_LOGIN_FAILED_COUNT', resp.loginInfo.failedLoginCount);

					// get further info about the logged in user
					var xhr2 = new XMLHttpRequest();
					xhr2.open("GET", "https://waytostay.atlassian.net/rest/api/latest/user?username=paulo.a", true);
					xhr2.onreadystatechange = function () {
						if (xhr2.readyState == 4) {
							var resp = JSON.parse(xhr2.responseText);

							if (!resp.errorMessages) {
								window.localStorage.setItem('JIRA_USER_NAME', resp.displayName);
								window.localStorage.setItem('JIRA_USER_EMAIL', resp.emailAddress);
								window.localStorage.setItem('JIRA_USER_AVATAR', resp.avatarUrls["48x48"]); // &size=small
							}
						}
					}
					xhr2.send();
				}
			}
		};
		xhr.send();
	},



	getServerInfo: function () {
		var REQUEST_STRING = "serverInfo",
			xhr = new XMLHttpRequest();

		xhr.open("GET", this.getAtlassianRestAPI() + REQUEST_STRING, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4) {
				var resp = JSON.parse(xhr.responseText);

				window.localStorage.setItem('JIRA_SERVER_VERSION', resp.version);
				window.localStorage.setItem('JIRA_SERVER_BUILD', resp.buildNumber);
				window.localStorage.setItem('JIRA_SERVER_TIME', resp.serverTime);
			}
		};
		xhr.send();
	},


	checkMyIssues: function () {
		var REQUEST_STRING = "search?jql=fixVersion+%3D+earliestUnreleasedVersion%28%22WTS%22%29+AND+%28assignee+%3D+currentUser%28%29+OR+assignee+is+EMPTY%29+AND+status+not+in+%28Closed%2C+Resolved%29+ORDER+BY+status%2C+priority%2C+assignee+DESC";

		var xhr = new XMLHttpRequest();
		xhr.open("GET", this.getAtlassianRestAPI() + REQUEST_STRING, true);
		xhr.onreadystatechange = function () {
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
	},


	getAtlassianRestAPI: function () {
		return "https://waytostay.atlassian.net/rest/api/2/";
	}
}



/*
myAssignedIssuesChecker = chrome.alarms.create({
	delayInMinutes: 0,
	periodInMinutes: .1
});

chrome.alarms.onAlarm.addListener(function (myAssignedIssuesChecker) {
	
});
//*/

jiraBuddyCRX.init();
