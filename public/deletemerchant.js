function deleteMerchant(mid){
    $.ajax({
        url: '/merchant/' + mid,
        type: 'DELETE',
        success: function(result){
            window.location.reload(true);
        }
    })
};