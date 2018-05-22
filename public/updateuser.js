function updateUser(uid){
    $.ajax({
        url: '/user/' + uid,
        type: 'PUT',
        data: $('#updateuser').serialize(),
        success: function(result){
            window.location.replace("./");
        }
    })
};