function updateMerchant(mid) {
    var merchName = document.getElementById("shop_name").value;

    /*
    console.log(merchName);
    */

    if (merchName.length === 0) {
        alert("Shop name cannot be empty");
    }
    else {

        $.ajax({
            url: '/merchant/' + mid,
            type: 'PUT',
            data: $('#updatemerchant').serialize(),
            success: function (result) {
                window.location.replace("./");
            }
        })
    }
};function updateMerchant(mid){
    $.ajax({
        url: '/merchant/' + mid,
        type: 'PUT',
        data: $('#updatemerchant').serialize(),
        success: function(result){
            window.location.replace("./");
        }
    })
};