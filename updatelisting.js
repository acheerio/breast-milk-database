function updateListing(lid){
    $.ajax({
        url: '/listing/' + lid,
        type: 'PUT',
        data: $('#updatelisting').serialize(),
        success: function(result){
            window.location.replace("./");
        }
    })
};