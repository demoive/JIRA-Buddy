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
		banners = JSON.parse(localStorage['banners'] || null),
		queryResultsTemplate = Handlebars.templates['popup-query-results-table.handlebars.html'];

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

	// force the badge query to be executed and use the results to populate the table
	chrome.extension.sendMessage({execBadgeQuery: true}, populateQueryResultsTable);

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





	// load the template and compile the source
	// let's do this in the background once when the extension is loaded.
	// we can save the compiled template into sessionStorage?
	// or instead, load and compile it only if the sessionStorage doesn't yet exist
	/*
	$.ajax({
		url: 'assets/view/popup-query-results-table.mustache.html',
		success: function (source) {
			//queryResultsTemplate = Handlebars.compile(source);
			//queryResultsTemplate = Hogan.compile(source);
			//console.log(queryResultsTemplate);
			//queryResultsTemplate = source;
		}
	});
	//*/

	$('#filter-query-selector').on('change', '#fav-filters', function () {
		// get jql from localStorage at $(this)
		var jql,
			filter = $(this).val();

		if (filter !== '') {
			jql = filters[filter] && filters[filter].query;
			chrome.extension.sendMessage({execQuery: jql}, populateQueryResultsTable);
		}

		return false;
	});


	var filters = JSON.parse(window.localStorage.getItem('JIRA_USER_FILTERS'));
	if (filters !== null) {
		$.each(filters, function (indx, el) {
			$('#fav-filters').append($('<option value="' + el.id + '">' + el.name + '</option>'));
		});

		$('#fav-filters').val(window.localStorage.getItem('badgeQueryId') || '');
	}


	$('#filter-query-results').on('click', 'a.issue-key', function () {
		chrome.extension.sendMessage({showIssue: $(this).attr('data-key')}, function (response) { });

		return false;
	});


	/**
	 * 
	 */
	function populateQueryResultsTable(queryData) {
		console.log("received the latest badge query data within the popup!");
		console.log(queryData);

		if (queryData.maxResults < queryData.total) {
			console.log("Paging required for query results table");
		}

		$('#filter-query-results').html(queryResultsTemplate(queryData));
		//$('#filter-query-results').html(queryResultsTemplate.render(queryData));
		//$('#filter-query-results').html(Mustache.render(queryResultsTemplate, queryData));

		/*
		$.each(queryData.issues, function (indx, issue) {
			console.log(issue.key);
		});
		//*/
	}

	/**
	 * Called when the search form is submitted.
	 *
	 * If the input text doesn't include the project prefix,
	 * prepends it to the issue number before checking currently open tabs.
	 */
	function submitted() {
		var hasPrefixRegExp = /.+-\d+/,
			requestedIssue = $searchInput.val();

		//issue = isNaN(issue) ? issue : (JIRA_PROJECT_PREFIX + "-" + issue);
		requestedIssue = hasPrefixRegExp.test(requestedIssue) ? requestedIssue : (localStorage['projectContext'] + "-" + requestedIssue);
		chrome.extension.sendMessage({showIssue: requestedIssue}, function (response) { });

		localStorage['lastRequest'] = requestedIssue;

		return false;
	}
});



/*
Ideas:
- Default sounds? Enable/disable them?
- Provide sample JQLs:
  - https://confluence.atlassian.com/display/JIRACOM/Example+SQL+queries+for+JIRA
  - show all watched issue since the current fix version
- Consider strictly tieing the Badge Query to a Favourite filter from within JIRA.
  - This implies that on each query interval, we would first have to check if it still exist and grab its potentially updated JQL value
  - If no longer exists, simply disable the badge query (perhaps with a nice message including the ID number)
  - The other option is to allow the selection of a favourite filter to simply populate the "custom" badge query field

Logos/Icons:
- http://www.atlassian.com/company/press/resources/?tab=logos
- https://confluence.atlassian.com/display/JIRACOM/Extra+Jira+Icons

Other Extensions
- Goto Bug (for JIRA): https://chrome.google.com/webstore/detail/goto-bug-for-jira/ocjecccldncbghkfbplmopcgafnfffoc/
- JIRA Notifier: https://chrome.google.com/webstore/detail/jira-notifier/gmpioihmcpcbfboffahfekpcmooddonb/
- JIRA assistant for Google Chrome: https://chrome.google.com/webstore/detail/jira-assistant-for-google/afpofdeegmmclngjmadpjaajacebkege/
*/
