function updateReview(rid) {
    var reviewTitle = document.getElementById("title").value;
    var reviewBody = document.getElementById("body").value;

    /*
    console.log(reviewTitle);
    console.log(reviewBody);
    */

    if (reviewTitle.length === 0) {
        alert("Review Title cannot be empty");
    }
    else if (reviewBody.length === 0) {
        alert("Body cannot be empty");
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