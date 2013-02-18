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
			INJECT_SCRIPT_CODE_PLACEHOLDER = '(function () {\n  "use strict";\n\n  // Start customizing!\n}());',
			//$optionsSave = $('#options-save'),

			banners = JSON.parse(window.localStorage.getItem('banners')),
			filters = JSON.parse(window.localStorage.getItem('JIRA_USER_FILTERS'));


/*
			// the message should query https://waytostay.atlassian.net/rest/api/2/filter/favourite
			var response = ;
			//chrome.extension.sendMessage({getFavoriteFilters: ''}, function (response) {
				var $filter,
					templateCode = $('#fav-filter-template').html();

				console.log(response);

				$.each(response, function (indx, filter) {
					console.log(filter.id);
					console.log(filter.name);
					//console.log(filter.description);
					console.log(filter.jql);


					$filter = $(templateCode.supplant(filter));


					$('#fav-filters').append($filter);
				});

				$('#fav-filters').on('change', function () {
					// update the local storage saved values (id and jql)
					// re-trigger the badge and interval
				});
			//});
//*/




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

		$jiraAccountId.text((window.localStorage.getItem('JIRA_ACCOUNT_ID') || 'default'));
		$jiraAccountId.on('blur', function () {
			// if value differs, save it and run any other function that changes based on this value (basically, something like the init() function)
			window.localStorage.setItem('JIRA_ACCOUNT_ID', $(this).text());

			// https://waytostay.atlassian.net/rest/api/2/project/
		});


		$('#add-banner').on('click', function () {
			$(this).before($('#banner-form-template').html().supplant({name:'', source:''}));

			return false;
		});

		$(document).on('click', '.banner a', function () {
			$(this).closest('form').remove();
			saveBanners();

			return false;
		});

		$(document).on('blur', '.banner input, .banner textarea', function () {
			saveBanners();

			return false;
		});

		// convert to using jQuery's templates?
		if (banners !== null) {
			var templateCode = $('#banner-form-template').html();

			$.each(banners, function (indx, el) {
				$('#add-banner').before($(templateCode.supplant(el)));
			});
		}

		if (filters !== null) {
			$.each(filters, function (indx, el) {
				$('#fav-filters').append($('<option value="' + el.id + '">' + el.name + '</option>'));
			});
		}



		$('#fav-filters').on('change', function () {
			var query,
				filter = $(this).val();

			if (filter !== '') {
				query = filters[filter] && filters[filter].query;

				window.localStorage.setItem('badgeQuery', query);
				window.localStorage.setItem('badgeQueryId', filter);
			} else {
				window.localStorage.removeItem('badgeQuery');
				window.localStorage.removeItem('badgeQueryId');
			}
		}).val(window.localStorage.getItem('badgeQueryId') || '');



		$('#description-template-value').on('blur', function () {
			var template = $(this).val();

			if (template.trim() !== '') {
				window.localStorage.setItem('descriptionTemplate', template);
			} else {
				window.localStorage.removeItem('descriptionTemplate');
			}
		}).val(window.localStorage.getItem('descriptionTemplate') || '');



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


	function saveBanners() {
		var banners = [];

		$('.banner').each(function () {
			banners.push({
				name: $(this).find('input[name="name"]').val(),
				source: $(this).find('textarea[name="source"]').val()
				//markup: https://waytostay.atlassian.net/rest/api/1.0/render
			});
		});

		window.localStorage.setItem('banners', JSON.stringify(banners));
	}
}());
