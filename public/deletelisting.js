function deleteListing(lid){
    $.ajax({
        url: '/listing/' + lid,
        type: 'DELETE',
        success: function(result){
            window.location.reload(true);
        }
    })
};