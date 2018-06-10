function updateReview(rid) {
    var reviewTitle = document.getElementById("title").value;
    var reviewBody = document.getElementById("body").value;

    if (reviewTitle.length === 0) {
        alert("Review Title cannot be empty");
    }
    else {
        $.ajax({
            url: '/review/' + rid,
            type: 'PUT',
            data: $('#updatereview').serialize(),
            success: function (result) {
                window.location.replace("./");
            }
        })
    }
};

function selectDropdown(fieldId, fieldValue) {
	(document.getElementById(fieldId)).value = fieldValue;
};