function updateUser(uid) {
    var userFname = document.getElementById("fname").value;
    var userLname = document.getElementById("lname").value;
    var userEmail = document.getElementById("email").value;
    var userAddLine1 = document.getElementById("add_line1").value;
    //var userAddLine2 = document.getElementById("add_line2").value;
    var userCity = document.getElementById("city").value;
    var userState = document.getElementById("state").value;
    var userZip = document.getElementById("zip").value;


    /*
    console.log(userFname);
    console.log(userLname);
    console.log(userEmail);
    console.log(userAddLine1);
    console.log(userAddLine2);
    console.log(userCity);
    console.log(userState);
    console.log(userZip);
    */

    if (userFname.length === 0) {
        alert("First name cannot be empty");
    }
    else if (userLname.length === 0) {
        alert("Last name cannot be empty");
    }
    else if (userEmail.length === 0) {
        alert("Email cannot be empty");
    }
    else if (userAddLine1.length === 0) {
        alert("Address Line 1 cannot be empty");
    }
    else if (userCity.length === 0) {
        alert("City cannot be empty");
    }
    else if (userState.length === 0) {
        alert("State cannot be empty");
    }
    else if (userZip.length === 0) {
        alert("Zip cannot be empty");
    }
    else {
        $.ajax({
            url: '/user/' + uid,
            type: 'PUT',
            data: $('#updateuser').serialize(),
            success: function (result) {
                window.location.replace("./");


            }
        })
    }
};