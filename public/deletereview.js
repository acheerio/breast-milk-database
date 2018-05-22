function deleteReview(rid){
    $.ajax({
        url: '/review/' + rid,
        type: 'DELETE',
        success: function(result){
            window.location.reload(true);
        }
    })
};