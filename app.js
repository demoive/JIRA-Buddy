(function () {
	"use strict";

	var JIRA_ACCOUNT_ID = localStorage['JIRA_ACCOUNT_ID'],
		JIRA_PROJECT_PREFIX = localStorage['JIRA_PROJECT_PREFIX'];

	/**
	 * jQuery's onDocumentReady function: called when
	 * the DOM has been fully loaded (not including resources).
	 *
	 * Initializes the pop-up and defines the functions
	 */
	$(function() {
		var $searchForm = $('#search-form'),
			$searchInput = $('#search-input'),
			$searchSubmit = $('#search-submit'),
			requestedIssue;

		if (!JIRA_ACCOUNT_ID || !JIRA_PROJECT_PREFIX) {
			$searchForm.html('<a href="options.html" target="_blank">Settings</a>');

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
				reg = new RegExp("^https?://" + JIRA_ACCOUNT_ID + ".atlassian.net/browse/" + requestedIssue);

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

		$searchForm.on('submit', submitted);
	});
}());


/*
Popup:
- goto form
- recent searches
- set banners

Background:
- check every minute for issues assigned to me
- ! if can't check

User script
- inject thing into jira pages
*/