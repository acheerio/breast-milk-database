function updateListing(lid) {
    var listTitle = document.getElementById("listing-name").value;
    var listAmount = document.getElementById("listing-amount").value;
    var listPrice = document.getElementById("listing-price").value;
    var listStart = document.getElementById("start-date").value;
    var listEnd = document.getElementById("end-date").value;

    /*
    console.log(listTitle);
    console.log(listTitle.length);
    console.log(listAmount);
    console.log(listPrice);
    console.log(listStart);
    console.log(listEnd);
    */

    if (listTitle.length === 0) {
        alert("Listing Name cannot be empty");
    }
    else if (listAmount.length === 0) {
         alert("Amount cannot be empty");
    }
    else if (listPrice.length === 0) {
         alert("Price cannot be empty");
    }
    else if (listStart.length === 0) {
        alert("Start date cannot be empty");
    }
    else if (listEnd.length === 0) {
        alert("End date cannot be empty");
    }
    else {
        $.ajax({
            url: '/listing/' + lid,
            type: 'PUT',
            data: $('#updatelisting').serialize(),
            success: function (result) {
                window.location.replace("./");
            }
        })
    }


};