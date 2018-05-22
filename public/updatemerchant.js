function updateMerchant(mid){
    $.ajax({
        url: '/merchant/' + mid,
        type: 'PUT',
        data: $('#updatemerchant').serialize(),
        success: function(result){
            window.location.replace("./");
        }
    })
};