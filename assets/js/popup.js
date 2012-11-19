﻿"use strict";

var JIRA_ACCOUNT_ID = localStorage['JIRA_ACCOUNT_ID'],
	JIRA_PROJECT_PREFIX = localStorage['JIRA_PROJECT_PREFIX'],
	//JIRA_XSRF_TOKEN = 'atlassian.xsrf.token',
	JIRA_URL_BANNER_SET = 'https://' + JIRA_ACCOUNT_ID + '.atlassian.net/secure/admin/EditAnnouncementBanner.jspa';
	//JIRA_URL_BANNER_VIEW = 'https://' + JIRA_ACCOUNT_ID + '.atlassian.net/secure/admin/EditAnnouncementBanner!default.jspa';


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
$(function() {
	var //$searchForm = $('#search-form'),
		$searchInput = $('#search-input'),
		$searchSubmit = $('#search-submit'),
		$serverInfo = $('#server-info'),
		banners = JSON.parse(localStorage['banners']),
		requestedIssue;

	if (!JIRA_ACCOUNT_ID || !JIRA_PROJECT_PREFIX) {
		$('#default-popup').html('<a href="options.html" target="_blank">Settings</a>');

		return;
	}

	$searchInput.attr('value', ((localStorage['lastRequest']) || ''));

	$searchInput.focus();
	$searchInput.select();
	$searchSubmit.value = chrome.i18n.getMessage("submitButtonLabel");

	$serverInfo.text('JIRA OnDemand (v' + localStorage['JIRA_SERVER_VERSION'] + ' b' + localStorage['JIRA_SERVER_BUILD'] + ')');


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

	if (banners !== null) {
		var $bannerButton;

		$.each(banners, function (indx, el) {
			$bannerButton = $('<button class="set-banner">' + el.name + '</button>');
			$bannerButton.on('click', function () {
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
						"announcement": el.content
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



/*
Popup:
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

- AWESOMENESS:
	var descriptionTemplate = "BLAH";
	// or just try using jQuery as the function name ((typeof jQuery != "undefined"))
	bfjQueryoverride("body").on('focus', '#description', function () { bfjQueryoverride(this).val(descriptionTemplate) });
	bfjQueryoverride("body").on('blur', '#description', function () { bfjQueryoverride(this).val('') });
	- but no jquery on this page: https://waytostay.atlassian.net/secure/CreateIssue.jspa (and script loading still works)

Ideas:
- If 1 issue assigned to me, prefil it in the quick-goto
- Code Monkey and customizable injection script as an option
- Default sounds? Enable/disable them?
- Provide sample JQLs: https://confluence.atlassian.com/display/JIRACOM/Example+SQL+queries+for+JIRA

Logos/Icons:
- http://www.atlassian.com/company/press/resources/?tab=logos
- https://confluence.atlassian.com/display/JIRACOM/Extra+Jira+Icons

- Goto Bug (for JIRA): https://chrome.google.com/webstore/detail/goto-bug-for-jira/ocjecccldncbghkfbplmopcgafnfffoc/
- JIRA Notifier: https://chrome.google.com/webstore/detail/jira-notifier/gmpioihmcpcbfboffahfekpcmooddonb/
- JIRA assistant for Google Chrome: https://chrome.google.com/webstore/detail/jira-assistant-for-google/afpofdeegmmclngjmadpjaajacebkege/
*/



var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-36256238-3']);
_gaq.push(['_trackPageview']);

(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();