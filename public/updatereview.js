function updateReview(rid){
    $.ajax({
        url: '/review/' + rid,
        type: 'PUT',
        data: $('#updatereview').serialize(),
        success: function(result){
            window.location.replace("./");
        }
    })
};

function selectDropdown(fieldId, fieldValue) {
	(document.getElementById(fieldId)).value = fieldValue;
};