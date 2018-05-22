function updateHelpful(uid, rid){
    $.ajax({
        url: '/helpful/' + uid + '/' + rid,
        type: 'PUT',
        data: $('#updatehelpful').serialize(),
        success: function(result){
            window.location.replace("./");
        }
    })
};