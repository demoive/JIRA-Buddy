/*jslint browser: true, plusplus: true, regexp: true, maxerr: 50, indent: 4 */
/*global chrome */

'use strict';

var JIRA_ACCOUNT_ID = localStorage['JIRA_ACCOUNT_ID'];
	//JIRA_XSRF_TOKEN = 'atlassian.xsrf.token',


$(window).on('load', function () {
//	$('body').css('width', '300px');
//	console.log;
});

/**
 * jQuery's onDocumentReady function: called when
 * the DOM has been fully loaded (not including resources).
 *
 * Initializes the pop-up and defines the functions
 */
$(function () {
	var //$searchForm = $('#search-form'),
		$searchInput = $('#search-input'),
		$searchSubmit = $('#search-submit'),
		$projectContext = $('#project-context'),
		$serverInfo = $('#server-info'),
		$userInfo = $('#user-info'),
		projects = JSON.parse(localStorage['JIRA_ACCOUNT_PROJECTS'] || null),
		banners = JSON.parse(localStorage['banners'] || null);

	if (!JIRA_ACCOUNT_ID) {
		$('#default-popup').html('<a href="options.html" target="_blank">Settings</a>');

		return;
	}

	$searchInput.attr('value', ((localStorage['lastRequest']) || ''));

	$searchInput.focus();
	$searchInput.select();
	$searchSubmit.text(chrome.i18n.getMessage("submitButtonLabel"));
	$searchSubmit.on('click', submitted);

	projects = projects && Object.keys(projects);
	projects && projects.forEach(function (key) {
		$projectContext.append($('<option value="' + key + '">' + key + '</option>'));
	});

	$projectContext.on('change', function () {
		localStorage['projectContext'] = $(this).val();
	});

	$projectContext.find('option[value="' + localStorage['projectContext'] + '"]').attr('selected', '');

	$serverInfo.text('JIRA OnDemand (v' + localStorage['JIRA_SERVER_VERSION'] + ' b' + localStorage['JIRA_SERVER_BUILD'] + ')');

	$userInfo.append(
		$('<img src="' + localStorage['JIRA_USER_AVATAR'] + '"> ' + localStorage['JIRA_USER_NAME'])
	).append(
		$('<strong title="' + localStorage['JIRA_USER_EMAIL'] + '"> ' + localStorage['JIRA_USER_NAME'] + '</strong><br><span>' + localStorage['JIRA_USER_LOGIN_COUNT'] + '/' + (localStorage['JIRA_USER_LOGIN_COUNT']*1 + localStorage['JIRA_USER_LOGIN_FAILED_COUNT']*1) + ' </span>')
	);

	// get list of versions (don't put into local storage)
	// update prev, current, next
	// get listing of badge query
	// update the crx badge (& interval)


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

	if (banners !== null) {
		var $bannerButton;

		$.each(banners, function (indx, el) {
			$bannerButton = $('<button class="set-banner">' + el.name + '</button>');

			$bannerButton.on('click', function () {
				$bannerButton.attr('disabled', 'disabled');

				chrome.extension.sendMessage({setBanner: el.content}, function (response) {
					$bannerButton.removeAttr('disabled');
					console.log(response);
				});

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

				return false;
			});

			$('#banners').append($bannerButton);
		});
	}


	/**
	 * Called when the search form is submitted.
	 *
	 * If the input text doesn't include the project prefix,
	 * prepends it to the issue number before checking currently open tabs.
	 */
	function submitted() {
		var hasPrefixRegExp = /.+-\d+/,
			requestedIssue = $searchInput.attr('value');

		//issue = isNaN(issue) ? issue : (JIRA_PROJECT_PREFIX + "-" + issue);
		requestedIssue = hasPrefixRegExp.test(requestedIssue) ? requestedIssue : (localStorage['projectContext'] + "-" + requestedIssue);
		chrome.extension.sendMessage({showIssue: requestedIssue}, function (response) { });

		localStorage['lastRequest'] = requestedIssue;

		return false;
	}
});



/*
Popup:
- Put name of badge query in the title of the extension button.
- variables (use bamboo structure)
- variables: https://confluence.atlassian.com/display/BONFIRE/Templates+and+Variables
- variables: https://confluence.atlassian.com/display/BAMBOO/Using+global,+plan+or+build-specific+variables
- GRAB BANNER before setting it and offer an "undo option"
- reply to the following once CRX is available publicly: https://jira.atlassian.com/browse/JRA-27864, https://confluence.atlassian.com/display/JIRA/Fields+Allowing+Custom+HTML+or+JavaScript
- recent searches
- shortcuts for JIRA backup: https://waytostay.atlassian.net/plugins/servlet/ondemandbackupmanager/admin
- shortcuts for WIKI backup: https://waytostay.atlassian.net/wiki/plugins/servlet/ondemandbackupmanager/admin
- link to Webdav: https://waytostay.atlassian.net/webdav/
- link to re-index: https://waytostay.atlassian.net/secure/admin/IndexAdmin.jspa
- Show calendar with fix versions (how often should that update)?
- button to pre-populate the Description field (keyboard shortcut for this and common formmating?)
- show all watched issue since the current fix version
- show all the issues which affect the counter badge
- convert search box to general search as well (if not in the "JIRA_PROJECT_PREFIX-\d+"" format)
- in the future, make it an autocomplete like the one that went away in the 5.0 upgrade
- in footer, show number of working hours per day, days per week (https://waytostay.atlassian.net/secure/admin/TimeTrackingAdmin!default.jspa)

Background:
- get the alarms working and convert to an Event Page!
- ! if can't reach server
- define/save JQL to search for on interval (definable interval?)

Ideas:
- If 1 issue assigned to me, prefil it in the quick-goto
- Code Monkey and customizable injection script as an option
- Default sounds? Enable/disable them?
- Provide sample JQLs: https://confluence.atlassian.com/display/JIRACOM/Example+SQL+queries+for+JIRA
- Consider strictly tieing the Badge Query to a Favourite filter from within JIRA.
  - This implies that on each query interval, we would first have to check if it still exist and grab its potentially updated JQL value
  - If no longer exists, simply disable the badge query (perhaps with a nice message including the ID number)
  - The other option is to allow the selection of a favourite filter to simply populate the "custom" badge query field
- Allow dragging and dropping files for attachements
- Add option of when to inject the content script

Logos/Icons:
- http://www.atlassian.com/company/press/resources/?tab=logos
- https://confluence.atlassian.com/display/JIRACOM/Extra+Jira+Icons

- Goto Bug (for JIRA): https://chrome.google.com/webstore/detail/goto-bug-for-jira/ocjecccldncbghkfbplmopcgafnfffoc/
- JIRA Notifier: https://chrome.google.com/webstore/detail/jira-notifier/gmpioihmcpcbfboffahfekpcmooddonb/
- JIRA assistant for Google Chrome: https://chrome.google.com/webstore/detail/jira-assistant-for-google/afpofdeegmmclngjmadpjaajacebkege/
*/
