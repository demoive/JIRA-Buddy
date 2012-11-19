/*jslint browser: true, plusplus: true, regexp: true, maxerr: 50, indent: 4 */
/*global chrome */

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-36256238-3']);
_gaq.push(['_trackPageview']);

(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


'use strict';

var jiraBuddyCRX = {
	ATLASSIAN_REST_API_BASE_PATHNAME: '/rest/api/2/',	// /rest/api/latest/
	ATLASSIAN_REST_AUTH_BASE_PATHNAME: '/rest/auth/1/session/',


	/**
	 * 
	 */
	init: function () {
		var self = this;
		// first thing needed is the account ID (to build the URLs)

		// get general server info
		this.getServerInfo();
		this.restAuthenticate();

		this.getProjectInfo();

		// should probably have a function called "updateProps()" which essentially called all three functions above in sequence
		// should be called when the atlassian id is updated in the options.html

		chrome.extension.onMessage.addListener(self.crxMessage);

		setInterval(self.checkMyIssues, (1.5 * 60 * 1000));
		self.checkMyIssues();
	},


	/**
	 * Receives all the messages sent winthin this extension
	 *
	 * @param {Object} The sent message
	 * @param {Object} The MessageSender object
	 * @param {Function} A callback function to send a response back to the sender
	 */
	crxMessage: function (msg, sender, responseCallback) {
		var self = jiraBuddyCRX;

		// sets the Announcement Banner (https://ATLASIAN_ACCOUNT_ID.atlassian.net/secure/admin/EditAnnouncementBanner!default.jspa)
		if (msg.setBanner !== undefined) {
			var xhr = new XMLHttpRequest(),
				xhrUrl = 'https://' + self.prop('JIRA_ACCOUNT_ID') + '.atlassian.net/secure/admin/EditAnnouncementBanner.jspa',
				xhrData = "announcement=" + encodeURIComponent(msg.setBanner);

			xhr.open('POST', xhrUrl, true);
			xhr.setRequestHeader("X-Atlassian-Token", "no-check");
			xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					if (xhr.status === 200) {
						responseCallback("w00t!");
					} else {
						responseCallback(":(");
					}
				}
			};
			xhr.send(xhrData);

			/*
			$.ajax({
				url: JIRA_URL_BANNER_SET,
				type: 'POST',
				// this header avoids needing the atl_token from being sent to authenticate. awesome :) 
				// https://developer.atlassian.com/display/JIRADEV/Form+Token+Handling#FormTokenHandling-Scripting
				headers: {
					"X-Atlassian-Token": 'no-check'
				},
				data: {
					"announcement": msg.setBanner
					//"bannerVisibility": 'private',
					//"Set Banner": 'Set Banner'
					//"atl_token": cookie.value
				},
				success: function () {
					// w00t!
				}
			});
			//*/

			/*
			chrome.cookies.get({
				url: 'https://' + JIRA_ACCOUNT_ID + '.atlassian.net/',
				name: JIRA_XSRF_TOKEN
			}, function (cookie) {
				console.log(cookie);
			});
			//*/
		} else if (msg.showIssue !== undefined) {
			chrome.tabs.query({
				url: 'https://' + self.prop('JIRA_ACCOUNT_ID') + '.atlassian.net/*'
			}, function (matchedTabs) {
				self.showOrOpenIssue(matchedTabs, msg.showIssue);
			});
		}

		return true;
	},


	/**
	 * Called by Chrome's tab query function.
	 *
	 * @param {Array} Array of Tabs that match the query
	 * @param {String} JIRA issue ID we need to show (either bring focus to or open)
	 */
	showOrOpenIssue: function (tabs, requestedIssue) {
		var i,
			self = this,
			reg = new RegExp('^https?://' + self.prop('JIRA_ACCOUNT_ID') + '.atlassian.net/browse/' + requestedIssue + '$');

		// bring focus to the first tab that matches the regular expression for an issue
		if ((tabs && tabs.length) > 0) {
			for (i = 0; i < tabs.length; ++i) {
				if (tabs[i].url.match(reg) !== null) {
					chrome.tabs.update(tabs[i].id, {
						selected: true
					});

					return;
				}
			}
		}

		// issue is not open in any tab, so open a new tab for it
		chrome.tabs.create({
			url: 'https://' + self.prop('JIRA_ACCOUNT_ID') + '.atlassian.net/browse/' + requestedIssue
		});
	},


	/**
	 * 
	 */
	getProjectInfo: function () {
		var self = this,
			xhr = new XMLHttpRequest(),
			xhrUrl = self.getRestUrl('api') + 'project';

		xhr.open('GET', xhrUrl, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					//var resp = JSON.parse(xhr.responseText);
					self.prop('JIRA_ACCOUNT_PROJECTS', xhr.responseText);
				}
			}
		};
		xhr.send();
	},


	/**
	 * 
	 */
	restAuthenticate: function () {
		var self = this,
			xhr = new XMLHttpRequest(),
			xhrUrl = self.getRestUrl('auth');

		xhr.open('GET', xhrUrl, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					var resp = JSON.parse(xhr.responseText);

					if (resp.errorMessages) {
						// not logged in!
						console.error("not logged in");

						self.prop('JIRA_USER_NAME', null);
						self.prop('JIRA_USER_EMAIL', null);
						self.prop('JIRA_USER_AVATAR', null);

						self.prop('JIRA_USER_LOGIN_NAME', null);
						self.prop('JIRA_USER_LOGIN_PREVIOUS', null);
						self.prop('JIRA_USER_LOGIN_COUNT', null);
						self.prop('JIRA_USER_LOGIN_FAILED_PREVIOUS', null);
						self.prop('JIRA_USER_LOGIN_FAILED_COUNT', null);

					} else {
						self.prop('JIRA_USER_LOGIN_NAME', resp.name);
						self.prop('JIRA_USER_LOGIN_PREVIOUS', resp.loginInfo.previousLoginTime);
						self.prop('JIRA_USER_LOGIN_COUNT', resp.loginInfo.loginCount);
						self.prop('JIRA_USER_LOGIN_FAILED_PREVIOUS', resp.loginInfo.lastFailedLoginTime);
						self.prop('JIRA_USER_LOGIN_FAILED_COUNT', resp.loginInfo.failedLoginCount);

						// get further info about the logged in user
						xhr = new XMLHttpRequest();
						xhrUrl = self.getRestUrl('api') + 'user?username=' + self.prop('JIRA_USER_LOGIN_NAME');
						xhr.open('GET', xhrUrl, true);
						xhr.onreadystatechange = function () {
							if (xhr.readyState === 4) {
								if (xhr.status === 200) {
									var resp = JSON.parse(xhr.responseText);

									if (!resp.errorMessages) {
										self.prop('JIRA_USER_NAME', resp.displayName);
										self.prop('JIRA_USER_EMAIL', resp.emailAddress);
										self.prop('JIRA_USER_AVATAR', resp.avatarUrls["48x48"]); // &size=small
									}
								}
							}
						}
						xhr.send();
					}
				}
			}
		};
		xhr.send();
	},


	/**
	 * 
	 */
	getServerInfo: function () {
		var self = this,
			xhr = new XMLHttpRequest(),
			xhrUrl = self.getRestUrl('api') + 'serverInfo';

		xhr.open('GET', xhrUrl, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					var resp = JSON.parse(xhr.responseText);

					self.prop('JIRA_SERVER_VERSION', resp.version);
					self.prop('JIRA_SERVER_BUILD', resp.buildNumber);
					self.prop('JIRA_SERVER_TIME', resp.serverTime);
				}
			}
		};
		xhr.send();
	},


	/**
	 * 
	 */
	checkMyIssues: function () {
		var self = this,
			xhr = new XMLHttpRequest(),
			xhrUrl = self.getRestUrl('api') + "search?jql=fixVersion+%3D+earliestUnreleasedVersion%28%22WTS%22%29+AND+%28assignee+%3D+currentUser%28%29+OR+assignee+is+EMPTY%29+AND+status+not+in+%28Closed%2C+Resolved%29+ORDER+BY+status%2C+priority%2C+assignee+DESC";

		xhr.open('GET', xhrUrl, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					var resp = JSON.parse(xhr.responseText);

					if (resp.errorMessages) {
						chrome.browserAction.setBadgeText({text: '!'});
						chrome.browserAction.setBadgeBackgroundColor({color: '#ff0000'});
					} else if (resp.total >= 1) {
						chrome.browserAction.setBadgeText({text: (resp.total + '')});
						chrome.browserAction.setBadgeBackgroundColor({color: '#5282d9'});
					}
				}
			}
		};
		xhr.send();
	},


	/**
	 * Retrieves or saves a value related to a LocalStorage key.
	 * If value is null, the key will be removed.
	 *
	 * @param {String} The key for LocalStorage
	 * @param {String} The value for LocalStorage
	 */
	prop: function (key, val) {
		if (val === null) {
			window.localStorage.removeItem(key)
		} else if (val === undefined) {
			return window.localStorage.getItem(key) || null;
		} else {
			window.localStorage.setItem(key, val)
		}
	},


	/**
	 * Forms different URLs needed for Atlassian API calls
	 *
	 * @param {String} The REST service being requested
	 */
	getRestUrl: function (service) {
		var self = this,
			accountId = self.prop('JIRA_ACCOUNT_ID');

		if (!accountId) {
			console.warn('No Account ID defined.');
			return null;
		}

		if (service === 'api') {
			return 'https://' + self.prop('JIRA_ACCOUNT_ID') + '.atlassian.net' + self.ATLASSIAN_REST_API_BASE_PATHNAME;
		}

		if (service === 'auth') {
			return 'https://' + self.prop('JIRA_ACCOUNT_ID') + '.atlassian.net' + self.ATLASSIAN_REST_AUTH_BASE_PATHNAME;
		}

		return null;
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
