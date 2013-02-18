

chrome.extension.sendMessage({getProp: "descriptionTemplate"}, function (descTemplate) {
	if (typeof jQuery !== "undefined") {
		jQuery('body').
		on('focus', '#description', function () {
			if (jQuery(this).val().trim() === '') {
				jQuery(this).val(descTemplate);
			}
		}).
		on('blur', '#description', function () {
			if (jQuery(this).val() === descTemplate) {
				jQuery(this).val('');
			}
		});
	}
});