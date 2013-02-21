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
	config: {
		BADGE_REFRESH_INTERVAL: (1.5 * 60 * 1000)
	},


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
		this.getFavFilters();

		// should probably have a function called "updateProps()" which essentially called all three functions above in sequence
		// should be called when the atlassian id is updated in the options.html

		chrome.extension.onMessage.addListener(self.crxMessage);
		chrome.tabs.onUpdated.addListener(self.injectCode);

		// this should be turned into a Chrome Extension Alarm in order to be event driven
		// consider adding a notification for when there are different (new) items in the results
		setInterval(function () { self.badgeQuery(); }, self.config.BADGE_REFRESH_INTERVAL);
		self.badgeQuery();
	},


	/**
	 * Injects the user-defined content script into tabs which accept them
	 *
	 * @param {integer} The id of the updated Tab
	 * @param {Object} Lists the changes ot the state of the tab that was updated
	 * @param {Object} A full Tab object of the tab that was updated
	 */
	injectCode: function (tabId, changeInfo, tab) {
		var self = jiraBuddyCRX,
			codeSrc,
			reg = new RegExp('^https?://' + self.prop('JIRA_ACCOUNT_ID') + '.atlassian.net');

		if (tab.url.match(reg) !== null) {
			// we register the injection as soon as the document begins loading
			// since we control when the script execution will occur within executeScript()
			if (changeInfo.status === 'loading') {
				codeSrc = self.prop('injectScriptCode');

				// ensures jQuery is installed
				chrome.tabs.executeScript(tabId, {
					file: 'assets/lib/jquery-1.8.2.min.js',
					runAt: 'document_start'
				}, function () {
					chrome.tabs.executeScript(tabId, {
						file: 'assets/js/descriptionTemplate.js',
						runAt: 'document_end'
					});

					if (codeSrc !== null) {
						chrome.tabs.executeScript(tabId, {
							code: codeSrc,
							runAt: 'document_end'
						});
					}
				});
			}
		}
	},


	/**
	 * Receives all the messages sent within this extension
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

/* this would be how to do the call using the new ajax function
			self.ajax({
				url: 'https://' + self.prop('JIRA_ACCOUNT_ID') + '.atlassian.net/secure/admin/EditAnnouncementBanner.jspa',
				type: 'POST',
				data: {
					"announcement": encodeURIComponent(msg.setBanner)
					//"bannerVisibility": 'private',
					//"Set Banner": 'Set Banner'
					//"atl_token": cookie.value
				},
				// this header avoids needing the atl_token from being sent to authenticate. awesome :) 
				// https://developer.atlassian.com/display/JIRADEV/Form+Token+Handling#FormTokenHandling-Scripting
				headers: {
					"X-Atlassian-Token": 'no-check'
				},
				success: function (xhr) {
console.log("return from banner set!");
					responseCallback("w00t!");
				}
			});
			//*/

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
		} else if (msg.getProp !== undefined) {
			responseCallback(self.prop(msg.getProp));
		} else if (msg.execBadgeQuery !== undefined) {
			self.badgeQuery(responseCallback);
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
	getFavFilters: function () {
		var self = this;

		self.ajax({
			url: self.getRestUrl('api') + 'filter/favourite',
			type: 'GET',
			success: function (xhr) {
				var filters = {},
					resp = JSON.parse(xhr.responseText);

				if (resp.errorMessages) {
					console.error("Unable to get Favourite Filters");

					self.prop('JIRA_USER_FILTERS', null);
				} else {
					for (var i = 0; i < resp.length; ++i) {
						filters[resp[i].id] = {
							id: resp[i].id,
							name: resp[i].name,
							description: resp[i].description,
							query: resp[i].jql
						};
					}

					self.prop('JIRA_USER_FILTERS', JSON.stringify(filters));

					// if there isn't already a "selected" project,
					// set it to the last one returned from the API call
					//if (!self.prop('badgeQuery') && resp.length >= 0) {
					//	self.prop('badgeQuery', resp[(resp.length - 1)].key);
					//}
				}
			}
		});
	},


	/**
	 * 
	 */
	getProjectInfo: function () {
		var self = this;

		self.ajax({
			url: self.getRestUrl('api') + 'project',
			type: 'GET',
			success: function (xhr) {
				var projInfo = {},
					resp = JSON.parse(xhr.responseText);

				if (resp.errorMessages) {
					console.error("Unable to get Project information");

					self.prop('JIRA_ACCOUNT_PROJECTS', null);
				} else {
					for (var i = 0; i < resp.length; ++i) {
						projInfo[resp[i].key] = {
							id: resp[i].id,
							name: resp[i].name,
							//description: resp[i].,
							avatar: resp[i].avatarUrls["48x48"]
							//lead:resp[i].
						};
					}

					self.prop('JIRA_ACCOUNT_PROJECTS', JSON.stringify(projInfo));

					// if there isn't already a "selected" project,
					// set it to the last one returned from the API call
					if (!self.prop('projectContext') && resp.length >= 0) {
						self.prop('projectContext', resp[(resp.length - 1)].key);
					}
				}
			}
		});

/* commented out for reference in case we decide to keep the manual ajax
			xhr = new XMLHttpRequest(),
			xhrUrl = self.getRestUrl('api') + 'project';

		xhr.open('GET', xhrUrl, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					var projInfo = {},
						resp = JSON.parse(xhr.responseText);

					if (resp.errorMessages) {
						console.error("Unable to get Project information");

						self.prop('JIRA_ACCOUNT_PROJECTS', null);
					} else {
						for (var i = 0; i < resp.length; ++i) {
							projInfo[resp[i].key] = {
								id: resp[i].id,
								name: resp[i].name,
								//description: resp[i].,
								avatar: resp[i].avatarUrls["48x48"]
								//lead:resp[i].
							};
						}

						self.prop('JIRA_ACCOUNT_PROJECTS', JSON.stringify(projInfo));

						// if there isn't already a "selected" project,
						// set it to the last one returned from the API call
						if (!self.prop('projectContext') && resp.length >= 0) {
							self.prop('projectContext', resp[(resp.length - 1)].key);
						}
					}
				}
			}
		};
		xhr.send();
*/
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
	badgeQuery: function (callback) {
		var self = this,
			xhr = new XMLHttpRequest(),
			query = self.prop('badgeQuery');
			xhrUrl = self.getRestUrl('api') + "search";

		if (query) {
			xhrUrl += "?jql=" + encodeURIComponent(query);

			xhr.open('GET', xhrUrl, true);
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					if (xhr.status === 200) {
						var resp = JSON.parse(xhr.responseText);

						callback && callback(resp);
						self.updateBadge(resp);
					}
				}
			};
			xhr.send();
		} else {
			chrome.browserAction.setBadgeText({text: ''});
		}
	},


	/**
	 * 
	 */
	updateBadge: function (resp) {
		var self = this,
			queryName = self.prop('badgeQueryName') || '';

		// also set the title of extension button to the query name
		chrome.browserAction.setTitle({title: queryName});

		if (resp.errorMessages) {
			chrome.browserAction.setBadgeText({text: '!'});
			chrome.browserAction.setBadgeBackgroundColor({color: '#ff0000'});
		} else if (resp.total >= 1) {
			chrome.browserAction.setBadgeText({text: (resp.total + '')});
			chrome.browserAction.setBadgeBackgroundColor({color: '#5282d9'});
		} else {
			chrome.browserAction.setBadgeText({text: ''});
		}
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
	},


	/**
	 * Mediocre, generic-purpose AJAX function.
	 * Just suitable for use within this extension.
	 */
	ajax: function (settings) {
		var req = new XMLHttpRequest(),
			queryString = '',
			queryKeys = typeof settings.data === 'object' && Object.keys(settings.data),
			headerKeys = typeof settings.headers === 'object' && Object.keys(settings.headers);

		req.onreadystatechange = function () {
			switch (req.readyState) {
				// 0: open() has not been called yet
				case req.UNSENT:
					break;

				// 1: send() has not been called yet
				case req.OPENED:
					break;

				// 2: send() has been called, and headers and status are available
				case req.HEADERS_RECEIVED:
					break;

				// 3: downloading (responseText holds partial data)
				case req.LOADING:
					break;

				// 4: operation complete
				case req.DONE:
					if (req.status === 200) {
						settings.success && settings.success(req);
					} else {
						//settings.fail(req);
					}
					break;
				default:
					break;
			}
		};

		req.open(settings.type, settings.url);
		//req.setRequestHeader('User-Agent', 'XMLHTTP/1.0');

		// required header if the request is of type POST
		if (settings.data && settings.type && settings.type.toUpperCase() === 'POST') {
			req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
		}

		// sets individual headers
		headerKeys && headerKeys.forEach(function (key) {
			req.setRequestHeader(key, settings.headers[key]);
		});

		// builds the query string from the data
		queryKeys && queryKeys.forEach(function (key, indx) {
			queryString += (indx > 0 ? '&' : '') + key + "=" + encodeURIComponent(settings.data[key]);
		});

		// test if the query string will be added to the URL properly if the URL already includes some
		// http://requestb.in/
		req.send(queryString);
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
