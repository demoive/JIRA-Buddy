(function () {
	"use strict";

	var JIRA_ACCOUNT_ID = localStorage['JIRA_ACCOUNT_ID'],
		JIRA_PROJECT_PREFIX = localStorage['JIRA_PROJECT_PREFIX'],
		JIRA_XSRF_TOKEN = 'atlassian.xsrf.token',
		JIRA_URL_BANNER_SET = 'https://' + JIRA_ACCOUNT_ID + '.atlassian.net/secure/admin/EditAnnouncementBanner.jspa',
		JIRA_URL_BANNER_VIEW = 'https://' + JIRA_ACCOUNT_ID + '.atlassian.net/secure/admin/EditAnnouncementBanner!default.jspa';


	/**
	 * jQuery's onDocumentReady function: called when
	 * the DOM has been fully loaded (not including resources).
	 *
	 * Initializes the pop-up and defines the functions
	 */
	$(function() {
		var //$searchForm = $('#search-form'),
			$searchInput = $('#search-input'),
			$searchSubmit = $('#search-submit'),
			$setBannerButton = $('#search-form button.set-banner'),
			requestedIssue;

		if (!JIRA_ACCOUNT_ID || !JIRA_PROJECT_PREFIX) {
			$('#default-popup').html('<a href="options.html" target="_blank">Settings</a>');

			return;
		}

		$searchInput.attr('value', ((localStorage['lastRequest']) || ''));
		
		$searchInput.focus();
		$searchInput.select();
		$searchSubmit.value = chrome.i18n.getMessage("submitButtonLabel");


		/**
		 * Called by Chrome's tab query function.
		 *
		 * @param {Array} Array of Tabs that match the query
		 */
		function showOrOpenIssue(tabs) {
			var i,
				reg = new RegExp("^https?://" + JIRA_ACCOUNT_ID + ".atlassian.net/browse/" + requestedIssue + "$");

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
				url: "https://" + JIRA_ACCOUNT_ID + ".atlassian.net/browse/" + requestedIssue
			});
		}

		// http://developer.chrome.com/extensions/manifest.html#permissions
		/*
		function copyToClipboard(text){
			var copyDiv = document.createElement('div');
			copyDiv.contentEditable = true;
			document.body.appendChild(copyDiv);
			copyDiv.innerText = text;
			//copyDiv.select();
			copyDiv.unselectable = "off";
			copyDiv.focus();
			document.execCommand('selectAll');
			document.execCommand('copy');
			document.body.removeChild(copyDiv);
		}
		//*/

		$setBannerButton.each(function () {
			$(this).on('click', function () {
				//copyToClipboard('skeebs');

				/*
				chrome.tabs.create({
					url: JIRA_URL_BANNER_VIEW
				}, function (createdTab) {
					chrome.tabs.executeScript(createdTab.id, {
						code: 'alert("injected code!")'
					}, function (arr) {
						console.log(arr);
					});
				});
				*/

				/*
				chrome.cookies.get({
					url: 'https://' + JIRA_ACCOUNT_ID + '.atlassian.net/',
					name: JIRA_XSRF_TOKEN
				}, function (cookie) {
					console.log(cookie);
				});
				//*/

				$.ajax({
					url: JIRA_URL_BANNER_SET,
					type: 'POST',
					// this header avoids needing the atl_token from being sent to authenticate. awesome :) 
					// https://developer.atlassian.com/display/JIRADEV/Form+Token+Handling#FormTokenHandling-Scripting
					headers: {
						"X-Atlassian-Token": 'no-check'
					},
					data: {
						"announcement": '{panel: borderStyle=solid | borderWidth=2 | borderColor=#69a936 | bgColor=#d5f0ce}paulo test 5{panel}',
						//"bannerVisibility": 'private',
						//"Set Banner": 'Set Banner'
						//"atl_token": cookie.value
					},
					success: function () {
						// w00t!
					}
				});

				return false;
			});
		});

		/**
		 * Called when the search form is submitted.
		 *
		 * If the input text doesn't include the project prefix,
		 * prepends it to the issue number before checking currently open tabs.
		 */
		function submitted() {
			var hasPrefixRegExp = /.+-\d+/;

			requestedIssue = $searchInput.attr('value');

			//issue = isNaN(issue) ? issue : (JIRA_PROJECT_PREFIX + "-" + issue);
			requestedIssue = hasPrefixRegExp.test(requestedIssue) ? requestedIssue : (JIRA_PROJECT_PREFIX + "-" + requestedIssue);

			chrome.tabs.query({
				url: "https://" + JIRA_ACCOUNT_ID + ".atlassian.net/*"
			}, showOrOpenIssue);

			localStorage['lastRequest'] = requestedIssue;

			return false;
		}

		$searchSubmit.on('click', submitted);
	});
}());


/*
Popup:
- recent searches
- shortcuts for JIRA backup: https://waytostay.atlassian.net/plugins/servlet/ondemandbackupmanager/admin
- shortcuts for WIKI backup: https://waytostay.atlassian.net/wiki/plugins/servlet/ondemandbackupmanager/admin
- link to Webdav: https://waytostay.atlassian.net/webdav/
- Show calendar with fix versions (how often should that update)?
- button to pre-populate the Description field (keyboard shortcut for this and common formmating?)
- show all watched issue since the current fix version
- show all the issues which affect the counter badge
- convert search box to general search as well (if not in the "JIRA_PROJECT_PREFIX-\d+"" format)
- in the future, make it an autocomplete like the one that went away in the 5.0 upgrade

Background:
- get the alarms working and convert to an Event Page!
- ! if can't reach server
- define/save JQL to search for on interval (definable interval?)

Ideas:
- If 1 issue assigned to me, prefil it in the quick-goto
- Code Monkey and customizable injection script as an option
- Default sounds? Enable/disable them?
- Provide sample JQLs: https://confluence.atlassian.com/display/JIRACOM/Example+SQL+queries+for+JIRA

- Goto Bug (for JIRA): https://chrome.google.com/webstore/detail/goto-bug-for-jira/ocjecccldncbghkfbplmopcgafnfffoc/
- JIRA Notifier: https://chrome.google.com/webstore/detail/jira-notifier/gmpioihmcpcbfboffahfekpcmooddonb/
- JIRA assistant for Google Chrome: https://chrome.google.com/webstore/detail/jira-assistant-for-google/afpofdeegmmclngjmadpjaajacebkege/
*/