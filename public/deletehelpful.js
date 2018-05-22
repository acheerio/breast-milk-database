function deleteHelpful(uid, rid){
    $.ajax({
        url: '/helpful/' + uid + '/' + rid,
        type: 'DELETE',
        success: function(result){
            window.location.reload(true);
        }
    })
};