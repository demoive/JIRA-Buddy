(function () {
	"use strict";

	/**
	 * jQuery's onDocumentReady function: called when
	 * the DOM has been fully loaded (not including resources).
	 *
	 * Initializes the pop-up and defines the functions
	 */
	$(function() {
		var $optionsForm = $('#options-form'),
			$jiraAccountId = $('#jira-account-id'),
			$jiraProjectPrefix = $('#jira-project-prefix'),
			$optionsSave = $('#options-save');


		/**
		 * Called when the options form is submitted.
		 */
		function saveOptions() {
			localStorage['JIRA_ACCOUNT_ID'] = $jiraAccountId.attr('value');
			localStorage['JIRA_PROJECT_PREFIX'] = $jiraProjectPrefix.attr('value');

			return false;
		}

		$jiraAccountId.attr('value', ((localStorage['JIRA_ACCOUNT_ID']) || ''));
		$jiraProjectPrefix.attr('value', ((localStorage['JIRA_PROJECT_PREFIX']) || ''));

		$optionsSave.value = chrome.i18n.getMessage("optionsSaveButtonLabel");
		$optionsForm.on('submit', saveOptions);
	});
}());
