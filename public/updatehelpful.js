function updateHelpful(uid, rid){
    $.ajax({
        url: '/helpful/' + uid + '/' + rid,
        type: 'PUT',
        data: $('#updatehelpful').serialize(),
        success: function(result){
            window.location.replace("/helpful");
        }
    })
};

function selectDropdown(fieldId, fieldValue) {
	(document.getElementById(fieldId)).value = fieldValue;
};