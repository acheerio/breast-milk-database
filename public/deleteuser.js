function deleteUser(uid){
    $.ajax({
        url: '/user/' + uid,
        type: 'DELETE',
        success: function(result){
            window.location.reload(true);
        }
    })
};