function filterListing(mid){
    $.ajax({
        url: '/listing/filter/' + mid,
        type: 'GET',
        data: $('#shop-filter').serialize(),
        success: function(result){
            window.location.replace("./");
        }
     })
};
