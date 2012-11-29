(function () {
	"use strict";

	if (!String.prototype.supplant) {
		String.prototype.supplant = function (o) {
			return this.replace(
				/\{([^{}]*)\}/g,
				function (a, b) {
					var r = o[b];
					return typeof r === 'string' || typeof r === 'number' ? r : a;
				}
			);
		};
	}

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
			INJECT_SCRIPT_CODE_PLACEHOLDER = '(function () {\n  "use strict";\n\n  // Start customizing!\n}());',
			//$optionsSave = $('#options-save'),


			banners = JSON.parse(window.localStorage.getItem('banners'));

		/*
		var myCodeMirror = CodeMirror.fromTextArea(document.getElementById('banner-red'), {
			value: document.getElementById('banner-red').value,
			mode: "javascript",
			theme: "ambiance",
			lineWrapping: true,
			lineNumbers: true,
			gutter: true,
			fixedGutter: true,

			onCursorActivity: function () {
				//myCodeMirror.matchHighlight("CodeMirror-matchhighlight");

				myCodeMirror.setLineClass(hlLine, null, null);
				hlLine = myCodeMirror.setLineClass(myCodeMirror.getCursor().line, null, "activeline");
			}
		});
		var hlLine = myCodeMirror.setLineClass(0, "activeline");
		//*/

		//myCodeMirror.matchBrackets();
		/*
		var myCodeMirror = CodeMirror(function(elt) {
			document.getElementById('banner-red').parentNode.replaceChild(elt, document.getElementById('banner-red'));
		}, {
			value: document.getElementById('banner-red').value,
			mode: "javascript"
		});
		//*/

		//$jiraAccountId.attr('value', ((localStorage['JIRA_ACCOUNT_ID']) || ''));
		$jiraAccountId.text((window.localStorage.getItem('JIRA_ACCOUNT_ID') || 'default'));
		$jiraAccountId.on('blur', function () {
			window.localStorage.setItem('JIRA_ACCOUNT_ID', $(this).text());

			// https://waytostay.atlassian.net/rest/api/2/project/
		});
		
		$jiraProjectPrefix.attr('value', ((localStorage['JIRA_PROJECT_PREFIX']) || ''));



		$('#add-banner').on('click', function () {
			$(this).before($('#banner-form-template').html().supplant({name:"", content:""}));

			return false;
		});

		$(document).on('click', '.banner a', function () {
			$(this).closest('form').remove();
			// this should also save the banners
			return false;
		});

		$(document).on('blur', '.banner input, .banner textarea', function () {
			var banners = [];

			$('.banner').each(function () {
				banners.push({
					name: $(this).find('input[name="name"]').val(),
					source: $(this).find('textarea[name="content"]').val()
					//markup: https://waytostay.atlassian.net/rest/api/1.0/render
				});
			});

			window.localStorage.setItem('banners', JSON.stringify(banners));

			return false;
		});

		// convert to using jQuery's templates
		if (banners !== null) {
			var templateCode = $('#banner-form-template').html();

			$.each(banners, function (indx, el) {
				$('#add-banner').before($(templateCode.supplant(el)));
			});
		}

		$('#inject-script-url').on('blur', function () {
			var url = $(this).val();

			if (url.trim() !== '') {
				window.localStorage.setItem('injectScriptURL', url);
			} else {
				window.localStorage.removeItem('injectScriptURL');
			}
		}).val(window.localStorage.getItem('injectScriptURL') || '');

		$('#inject-script-code').on('blur', function () {
			var code = $(this).val(),
				result = JSHINT(code);

			console.log("JSHINT results...");
			console.log(result);
			console.log(JSHINT.errors);
			console.log(JSHINT.data());

			if (code.trim() !== '' && code !== INJECT_SCRIPT_CODE_PLACEHOLDER) {
				window.localStorage.setItem('injectScriptCode', code);
			} else {
				window.localStorage.removeItem('injectScriptCode');
			}

		}).val(window.localStorage.getItem('injectScriptCode') || INJECT_SCRIPT_CODE_PLACEHOLDER);


		//$optionsSave.value = chrome.i18n.getMessage("optionsSaveButtonLabel");
		//$optionsForm.on('submit', saveOptions);
	});
}());
