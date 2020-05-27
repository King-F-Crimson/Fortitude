var username, user_email, is_emailVerified, icon, user_id;
var room = "lobby_link";
var rmid = "";
var human_room = "";
var user_img = "https://i.pinimg.com/originals/fc/68/f8/fc68f86873c9c661e84ad442cf8fb6cf.gif";

var connectable_servers = [];
var serverMembers = [];
var roles = [];
var rolecolours = [];

var friends_user_names = [];
var friends_user_ids = [];

var dm_users_id = "";

messages = [];
authors = [];
dates = [];
userId_message = [];
typing_local = [];
empty = [];

/*
var server_messages = new Array(2); 

called as:

stored_messages[0 = server, 1 = DM, 2 = Group//][serverId][messageNumber e.g. msg 1, 2, 3...] = "Hey Stop that..."

var stored_messages = new Array(2);
var stored_authors = new Array(2);
var stored_dates = new Array(2);
var stored_userId = new Array(2);

stored_messages[0][0] = "Hey Rebelious Scum!"; 
*/

if(room === ""){
  room = "deafult";
  human_room = "Deafult";
}

function changeForm() {
    document.getElementById("login").classList.toggle("hidden");
    document.getElementById("sign_up").classList.toggle("hidden"); 

    loginForm.reset();
    signupForm.reset();  
}

var firebaseConfig = {
    apiKey: "AIzaSyA0Mm7tzst4UDkc7niW1HxZMQDirbA7VIc",
    authDomain: "fortitude-0.firebaseapp.com",
    databaseURL: "https://fortitude-0.firebaseio.com",
    projectId: "fortitude-0",
    storageBucket: "fortitude-0.appspot.com",
    messagingSenderId: "1039342345774",
    appId: "1:1039342345774:web:12a14ae9dfc0453de709bf",
    measurementId: "G-3TELB2WL73"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

$("#loader").find("p").text("Connecting");

const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();
var storage = firebase.storage();

// Checking if user is logged in or not
auth.onAuthStateChanged(user => {
    var logout = $("#logout_button");
    var login = $("#login-button");

    if (user) {
        //console.log('user logged in: ', user);
        logout.removeClass("hidden");
        login.addClass("hidden");

        $("#auth").hide();

        username = user.displayName;
        user_email = user.email;
        is_emailVerified = user.emailVerified;
        icon = user.photoURL;
        user_id = user.uid;

        loadUserInfo(user);
    } else {
        //console.log('user logged out');
        logout.addClass("hidden");
        login.removeClass("hidden");

        $("#auth").show();

        loadUserInfo(user);
    }

    // Set All User-Related Information
    
})


// Signup
const signupForm = document.querySelector('#signup-form');
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // get user info
    const email = $("#signup-email").val();
    const password = $("#signup-password").val();
    var designated_dspln = $("#signup-username").val();

    // sign up the user

    auth.createUserWithEmailAndPassword(email,password).then(cred =>{
        var user = firebase.auth().currentUser;
        
        user.updateProfile({
            displayName: designated_dspln,
        }).then(function() {
            
        }).catch(function(error) {
            console.log(error);
        });
        
        username = user.displayName;
        user_email = user.email;
        user_id = user.uid;

        var now = new Date();

        db.collection("users").doc(user_id).set({
            creationDate: now,
            icon: "deafultUserIcon.jpg",
            servers: [],
            username: designated_dspln
        });

    }).then(() =>{
        signupForm.querySelector(".error").innerHTML = "";
        signupForm.querySelector(".error").classList.add("hidden");
        signupForm.reset();
        loadUserInfo(user);
    }).catch(err => {
        signupForm.querySelector(".error").classList.remove("hidden");
        signupForm.querySelector(".error").innerHTML = err.message;
    });

    //let id_settup = db.collection("users").doc(user.uid).id;

});

// Logout
const logout = document.querySelector('#logout_button');
logout.addEventListener('click', (e) => {
    e.preventDefault();

    auth.signOut().then(() => {
        //console.log('user signed out');
    })
});

// Login
const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // get user info
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;

    // log the user in
    auth.signInWithEmailAndPassword(email, password).then((cred) => {
        //console.log(cred.user);
        loginForm.reset();
    }).then(() =>{
        loginForm.querySelector(".error").innerHTML = "";
        loginForm.querySelector(".error").classList.add("hidden");
        loginForm.reset();
        loadUserInfo(user);
    }).catch(err => {
        loginForm.querySelector(".error").classList.remove("hidden");
        loginForm.querySelector(".error").innerHTML = err.message;
    });
});


function loadUserInfo(user) {
    var userInfo_div = $("#user");
    var users_name = userInfo_div.find("h4");
    var user_code = userInfo_div.find("h6");
    var users_hello = $("#lobby").find("h1");

    if(!user) {
        users_name.text("Logged Out");
        users_hello.text("Logged Out");
    }else {
        users_name.text(user.displayName);
        users_hello.text("Hello, " + user.displayName + "");
    }

    closeLoader();
}

function closeLoader(){
  setTimeout(function(){
      $("#loader").find("p").text("Having a good time!");
      setTimeout(function(){
        $("#loader").find("p").text("Logging In");
        
        var docRef = db.collection("users").doc(user_id);

        docRef.get().then(function(doc) {
            if (doc.exists) {
                console.log("Document data:", doc.data());

                for(var i = 0; i < doc.data().servers.length; i++){
                  connectable_servers.push(doc.data().servers[i]);
                }  
            } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
            }

           createServerNav();
            
        }).catch(function(error) {
            console.log("Error getting document:", error);
        }); 
      }, 500);
  }, 100);

 

  $("#loader").find("p").text("Logging In");

  closeForm();
}

function createServerNav(){
  for(var i = 0; i < connectable_servers.length; i++){
    var serverRef = db.collection("groups").doc(connectable_servers[i]);

    serverRef.get().then(function(doc) {
      var total_div = document.createElement("div");
          total_div.setAttribute("name", "server_item");
          //console.log(total_div.name);
          total_div.classList.add("list_item");
          total_div.classList.add("tooltip");
          total_div.id = doc.id;

      var small_div = document.createElement("div");

      var pill_span = document.createElement("span");
          pill_span.classList.add("pill_hidden");
          pill_span.id = i + "group";
          pill_span.style = "opacity: 1; transform: none;";

      var image = document.createElement("img");
          image.src = "https://cdn.wallpapersafari.com/47/75/i8cgUE.jpg";
          image.classList.add("list_item_image");
      

      var tooltip = document.createElement("span");
          tooltip.classList.add("tooltiptext");
          tooltip.innerHTML = doc.data().name;

      
      small_div.appendChild(pill_span);
      total_div.appendChild(small_div);    

      total_div.appendChild(image);
      total_div.appendChild(tooltip);

      document.getElementById("navigation").appendChild(total_div);
    }).catch(function(error) {
        setTimeout(completeNav, 500);
        console.log("Error getting document:", error);
    }); 

    if(i == connectable_servers.length - 1){
      setTimeout(completeNav, 500);
    }
  }

  if(connectable_servers.length == 0){
    setTimeout(completeNav, 500);
  }
}

function completeNav() {
  for(var i = 0; i < 1; i++){
    var total_div = document.createElement("div");
      total_div.classList.add("list_item");
      total_div.classList.add("add_list_item");
      total_div.classList.add("tooltip");
      total_div.id = "add_server";
      total_div.onclick = showServerCreator;

    var small_div = document.createElement("div");

    var pill_span = document.createElement("span");
        pill_span.classList.add("pill_hidden");
        pill_span.id = i + "group";
        pill_span.style = "opacity: 1; transform: none;";

    var image = document.createElement("img");
        image.src = "branding/new_server_inactive.png";
        image.classList.add("list_item_image");

    var tooltip = document.createElement("span");
        tooltip.classList.add("tooltiptext");
        tooltip.innerHTML = "Add Server";


    small_div.appendChild(pill_span);
    total_div.appendChild(small_div);    

    total_div.appendChild(image);
    total_div.appendChild(tooltip);

    document.getElementById("navigation").appendChild(total_div);
  }

  for(var i = 0; i < 1; i++){
    var total_div = document.createElement("div");
      total_div.classList.add("list_item");
      total_div.classList.add("search_for_list_items");
      total_div.classList.add("tooltip");
      total_div.id = "join_server2";
      total_div.setAttribute('onclick', "showServerJoin()")

    var small_div = document.createElement("div");

    var pill_span = document.createElement("span");
        pill_span.classList.add("pill_hidden");
        pill_span.id = i + "group";
        pill_span.style = "opacity: 1; transform: none;";

    var image = document.createElement("img");
        image.src = "branding/search_server_inactive.png";
        image.classList.add("list_item_image");

    var tooltip = document.createElement("span");
        tooltip.classList.add("tooltiptext");
        tooltip.innerHTML = "Server Search";

    small_div.appendChild(pill_span);
    total_div.appendChild(small_div);    

    total_div.appendChild(image);
    total_div.appendChild(tooltip);

    document.getElementById("navigation").appendChild(total_div);
  }
}

function enableAnimation() {

    // Hide all Hidden Elements. E8HIDEPOINTERHUB
    
    hideServerCreator();
    hideServerJoin();
    hideSucessfullJoin();
    hideServerMenu();
    hideSettings();
    hideMembers();
    hideSucessfullAdd();
    
    $("#user_card").hide();

    setTimeout(function(){
        loadDM();
      }, 500);

    setTimeout(function(){
      $("#loader").addClass("hidden");
      document.getElementById("Body").style.transition = "all .55s ease";
      loadFriendsList();
    }, 3000);

    document.getElementById("user_name_view").innerHTML = username;
    $("#user_name_img").attr("src", user_img);
}

function sendMessage() {
    var now = new Date();
    var msg = document.getElementById("message-input").value;

    msg = msg.replace(/>/g,"");
    msg = msg.replace(/</g,"");

    if(rmid !== "invalid"){
      if(room !== "lobby_link"){
        let autoID = db.collection("groups/"+ rmid +"/messages").doc().id;

        db.collection("groups/"+ rmid +"/messages").doc(autoID).set({
          sender: username,
          senderId: user_id,
          message: msg,
          timestamp: now
        }).then(function() {
            //console.log("Message created");
        });
      }else {
        let autoID = db.collection("users/"+ user_id +"/direct_messages/" + dm_users_id + "/messages").doc().id;

        db.collection("users/"+ user_id +"/direct_messages/" + dm_users_id + "/messages").doc(autoID).set({
          sender: username,
          senderId: user_id,
          message: msg,
          timestamp: now
        }).then(function() {
            //console.log("Message created");
        });
      }
    }else {
      
    }

    while(document.getElementById("message-container").firstChild){
      document.getElementById("message-container").removeChild( document.getElementById("message-container").firstChild);
    }

    if(rmid !== "invalid"){
      //joinServer(human_room);
      renderMessages();
    }   
}

function loadDM(){
  while(document.getElementById("DM").firstChild){
    document.getElementById("DM").removeChild( document.getElementById("DM").firstChild);
  }

  

  $("#send-container").hide();
  $("#message-input").hide()
  $("#message-container").hide();
  $("#serverMoreInfo").hide();

  $("#friends").hide();
  
  $("#lobby").show();

  $("#lobby_link").find("div span").removeClass("pill_hidden");
  $("#lobby_link").find("div span").addClass("pill");

  $("#lobby_link").find("img").attr("src","/branding/concept_logo_small_active.png");
  document.getElementById("header").style.backgroundImage = "linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0)), url('" + "https://media3.giphy.com/media/b29IZK1dP4aWs/giphy.gif" + "')";
  
  $("#serverName").text("Direct Messages");
  $("#connected_channel").text("Direct Messages");
  $("#connected_channel_desc").hide();
  $("#toggle_members").hide();

  $("#channels").hide();
  $("#members").hide();
  $("#DM").show();

  var usernames = [];
  var userids = [];

   db.collection("users/"+ user_id +"/direct_messages").get()
    .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          usernames.push(doc.data().username);
          userids.push(doc.id);
        });

        var direct_message_message = document.createElement("h4")
            direct_message_message.innerHTML = "DIRECT MESSAGES";

        var direct_message_friends_i = document.createElement("i");
            direct_message_friends_i.classList.add("fas");
            direct_message_friends_i.classList.add("fa-user-friends");

        var direct_messages_friends_text = document.createElement("h1");
            direct_messages_friends_text.innerHTML = "Friends";
            
        var direct_message_friends = document.createElement("div")
            direct_message_friends.append(direct_message_friends_i);
            direct_message_friends.append(direct_messages_friends_text);
            direct_message_friends.setAttribute('onclick', 'showFriendsList()');

        var direct_messages_about_text = document.createElement("h1");
            direct_messages_about_text.innerHTML = "About";

        var direct_message_about_i = document.createElement("i");
            direct_message_about_i.classList.add("fas");
            direct_message_about_i.classList.add("fa-info");
        
        var direct_message_about = document.createElement("div")
            direct_message_about.append(direct_message_about_i);
            direct_message_about.append(direct_messages_about_text);

        var direct_messages_home_text = document.createElement("h1");
            direct_messages_home_text.innerHTML = "Home";

        var direct_message_home_i = document.createElement("i");
            direct_message_home_i.classList.add("fas");
            direct_message_home_i.classList.add("fa-home");
        
        var direct_message_home = document.createElement("div")
            direct_message_home.append(direct_message_home_i);
            direct_message_home.append(direct_messages_home_text);
            direct_message_home.setAttribute('onclick', 'loadLobby()');

        document.getElementById("DM").append(direct_message_friends);
        //document.getElementById("DM").append(direct_message_about);
        document.getElementById("DM").append(direct_message_home);
        document.getElementById("DM").append(direct_message_message);

        

        for(var i = 0; i < usernames.length; i++){
          var usersname = document.createElement("p");
              usersname.innerHTML = usernames[i];
      
          var parent_div = document.createElement("div");
              parent_div.setAttribute('name', 'user_dm_able');
              parent_div.setAttribute('onclick', `loadConvo("${userids[i]}", "${usernames[i]}")`);
              parent_div.setAttribute('id', userids[i]);
              parent_div.classList.add("dm_element");
      
          parent_div.append(usersname);
          document.getElementById("DM").append(parent_div);
        }
    });
}

function loadConvo(usersid, usersname_dm) {
    room = "lobby_link";
    loadDM();
    dm_users_id = usersid;

    while(document.getElementById("message-container").firstChild){
      document.getElementById("message-container").removeChild( document.getElementById("message-container").firstChild);
    }

    while(messages.length > 0) {
      messages.pop();
      authors.pop();
      dates.pop();
      userId_message.pop();
      serverMembers.pop();
      roles.pop();
      rolecolours.pop();
    }

    //alert("Begining Conversation with " + usersid + " from " + objectid);
    if($(`#${usersid}`).length){
      document.getElementById(usersid).classList.add("dm_element_active");
    }else{
      // Create One... 
    }


    $("#lobby").hide();
    $("#friends").hide();
    
    $("#message-container").show();
    $("#send-container").show();
    $("#message-input").show();

    $("#message-input").attr("placeholder", "Message " + usersname_dm);

    db.collection("users/"+ user_id +"/direct_messages/" + usersid + "/messages").orderBy("timestamp", "desc").limit(100).get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            //console.log("Hey");
            //console.log(doc.id, " => ", doc.data());
            sender = doc.data().sender;
            authors.push(doc.data().sender);
            //console.log(sender);
            senderIdentification = doc.data().senderId;
            userId_message.push(doc.data().senderId);
            //console.log(senderIdentification);
            msge = doc.data().message;
            messages.push(doc.data().message);
            //console.log(msge);
            time = formatDate(doc.data().timestamp.toDate());
            dates.push(formatDate(doc.data().timestamp.toDate()));
            //console.log(time);
        });

        authors.reverse();
        userId_message.reverse();
        messages.reverse();
        dates.reverse();

        updateMessages(usersid);
        updateTyping();
        renderMessages();
    });

    // Load Conversations / DM with people
    // + Friends List (view) and addability from the user-server interaction menu.
}

function  showFriendsList() {
  $("#send-container").hide();
  $("#message-input").hide()
  $("#message-container").hide();
  $("#serverMoreInfo").hide();

  $("#serverName").text("Direct Messages");
  $("#connected_channel").text("Direct Messages");
  $("#connected_channel_desc").hide();
  $("#toggle_members").hide();

  $("#channels").hide();
  $("#members").hide();
  $("#DM").show();

  $("#connected_channel").innerHTML = "Friends";
  $("#connected_channel_desc").hide();

  $("#friends").show();
  $("#lobby").hide();
}

function loadFriendsList(){
  var usernames = [];
  var userids = [];

  while(document.getElementById("friends").firstChild){
    document.getElementById("friends").removeChild(document.getElementById("friends").firstChild);
  }

  db.collection("users/"+ user_id +"/friends").orderBy("latest_interaction", "desc").get()
    .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          console.log(doc.data());
          usernames.push(doc.data().name);
          userids.push(doc.id);

          friends_user_names.push(doc.data().name);
          friends_user_ids.push(doc.id);

          var this_users_name = doc.data().name;

          //console.log("users/"+ user_id +"/friends" + doc.data().name + ": " + doc.id);

          var docRef = db.collection("users").doc(doc.id);
          var image_source;
          var ur2 = "";

          

          docRef.get().then(function(doc) {
            image_source = doc.data().icon;
            console.log(this_users_name);
            
            var storageRef = firebase.storage().ref().child(image_source).getDownloadURL().then(function(url) {
              ur2 = url;
              
              var usersname = document.createElement("h1");
                  usersname.innerHTML = this_users_name;

              var userscode = document.createElement("h4");
                  userscode.innerHTML = "#4444";

              var userstext = document.createElement("div");
                  userstext.append(usersname);
                  userstext.append(userscode);
            
              var user_icon = document.createElement("img");
                  user_icon.src = ur2;
        
              var parent_div = document.createElement("div");
                  parent_div.setAttribute('onclick', `loadConvo("${doc.id}", "${this_users_name}")`);
                  parent_div.setAttribute('id', ".#");
                  parent_div.classList.add("friend");
              
              parent_div.append(user_icon);
              parent_div.append(userstext);
              document.getElementById("friends").append(parent_div);
            });                 
          });

          
        });
/*
        for(var i = 0; i < usernames.length; i++){
          var image_source = "";
          var usersname__ = "";
          var usersid__ = "";

          var docRef = db.collection("users").doc(userids[i]);

          docRef.get().then(function(doc) {
            if (doc.exists) {
                image_source = doc.data().icon;
                usersname__ = doc.data().username;
                usersid__ = doc.id;
            } else {
                console.log("No such document!");
            }

            var storageRef = firebase.storage().ref();
            var spaceRef = storageRef.child(image_source);
            //var path = spaceRef.fullPath;
            //console.log(spaceRef);
            
            spaceRef.getDownloadURL().then(function(url) {
              
              var xhr = new XMLHttpRequest();
              xhr.responseType = 'blob';

              xhr.onload = function(event) {
                var blob = xhr.response;
                blob.set({ 'Access-Control-Allow-Origin': 'true' }).sendStatus(200);
                //console.log(blob);
              };
              
              if("withCredentials" in xhr){
                xhr.open('GET', url);
                xhr.withCredentials = true;
                //xhr.setRequestHeader('Access-Control-Allow-Headers', '*');
                //xhr.setRequestHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500/');

                xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
                
                //xhr.setRequestHeader("Access-Control-Allow-Credentials", "true");
                xhr.setRequestHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
                xhr.setRequestHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Access-Control-Allow-Origin, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
                xhr.send();
              }else {
                console.log("Ooop, your computer no supporty");
              }


              //$.ajax({type: 'GET', murl: url, contentType: 'image',xhrFields: {withCredentials: false},headers: {}, success: function() {},error: function() {}});
          
              //response.set('Access-Control-Allow-Origin', '*');
              

              var usersname = document.createElement("h1");
                  usersname.innerHTML = friends_user_names[i];

              var userscode = document.createElement("h4");
                  userscode.innerHTML = "#4444";

              var userstext = document.createElement("div");
                  userstext.append(usersname);
                  userstext.append(userscode);
            
              var user_icon = document.createElement("img");
                  user_icon.src = url;
        
              var parent_div = document.createElement("div");
                  parent_div.setAttribute('onclick', 'loadConvo("' + usersid__ + '", "'+ 'dm' + i +'", "'+ usersname__ +'")');
                  parent_div.setAttribute('id', 'dm' + i);
                  parent_div.classList.add("friend");
              
              parent_div.append(user_icon);
              parent_div.append(userstext);
              document.getElementById("friends").append(parent_div);

              
            }).catch(function(error) {
              console.log(error);
            });        
          }); 
        } */
    });   // LOAD ICON AND WITH DM BAR

    //loadDM();
}

function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {

    // Check if the XMLHttpRequest object has a "withCredentials" property.
    // "withCredentials" only exists on XMLHTTPRequest2 objects.
    xhr.open(method, url, true);

  } else if (typeof XDomainRequest != "undefined") {

    // Otherwise, check if XDomainRequest.
    // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
    xhr = new XDomainRequest();
    xhr.open(method, url);

  } else {

    // Otherwise, CORS is not supported by the browser.
    xhr = null;

  }
  return xhr;
}

function loadLobby() {
  $("#send-container").hide();
  $("#message-input").hide()
  $("#message-container").hide();
  $("#serverMoreInfo").hide();

  $("#serverName").text("Direct Messages");
  $("#connected_channel").text("Direct Messages");
  $("#connected_channel_desc").hide();
  $("#toggle_members").hide();

  $("#channels").hide();
  $("#members").hide();
  $("#DM").show();

  $("#connected_channel").text("Friends");
  $("#connected_channel_desc").hide();

  $("#friends").hide();
  $("#lobby").show();
}

$("body").on("click",'div[name*="server_item"]',function(){  
    leaveRoom();

    console.log("Attempting to connect to server: " + this.id);

    if(this.id === "lobby_link"){
      loadDM();
      
      room = this.id;
    }else{
      $("#lobby_link").find("span").addClass("pill_hidden");
      $("#lobby_link").find("span").removeClass("pill");
      $("#lobby_link").find("img").removeClass("list_item_active");

      $("#send-container").show();
      $("#message-input").show();  
      $("#lobby").hide();
      $("#message-container").show();
      
      $("#channels").show();
      $("#members").show();
      $("#DM").hide();
      $("#friends").hide();
      

      $("#lobby_link").find("img").attr("src","/branding/concept_logo_small_deactive.png");

      room = this.id;
      toUpper(this.id);
      //loadServerID(this.id);
      joinServer(this.id);

      //console.log("JOINING " + this.id);
      $("#connected_channel").text(room);
      $("#connected_channel_desc").show();
      $("#toggle_members").show();
      $("#connected_channel_desc").text("wow betta change that!");
    }
});

// Create Server

$("#create_server").click(function(event){
  if($(event.target).is("#create_server")){
    hideServerCreator();
  }
});

$('#add_server').click(function() {
    showServerCreator();
});

$('#add_server2').click(function() {
    showServerCreator();
});

$('#close_server_form').click(function() {
    hideServerCreator();
});

function showServerCreator(){
  $("#create_server").show();
  $("#create_server *").show();
  $("#error").hide();

  $("#create_server").addClass("fade-in");
  $("#create_server").removeClass("fade-out");

  $("#create_server .sub_div").removeClass("scale-out-center");
  $("#create_server .sub_div").addClass("scale-up-center");
  //openForm();
}

function hideServerCreator(){
  $("#create_server .sub_div").removeClass("scale-up-center");
  $("#create_server .sub_div").addClass("scale-out-center");

  $("#create_server").addClass("fade-out");
  $("#create_server").removeClass("fade-in");

  setTimeout(function(){
    $("#create_server .sub_div").removeClass("scale-out-center");
    $("#create_server").hide();
    $("#create_server *").hide();
    $("#error").hide();
  }, 350);

  //closeForm();
}

$('#server_creator_form_submit').click(function(e) {
  e.preventDefault();
  
  var serverName = $("#s-name").val();
  $('#s-name').val('');

  if(serverName.includes("/")){
    $("#error").show();
  }else{
    $("#error").hide();

    createServer(serverName);
    hideServerCreator();
  }
});

$("#join_server").click(function(event){
  if($(event.target).is("#join_server")){
    hideServerJoin();
  }
});

// Join Server
$('#join_server2').click(function(e) {
    showServerJoin();
});

$('#join_server3').click(function() {
    showServerJoin();
});

$('#close_server_form2').click(function() {
    hideServerJoin();
});

function showServerJoin(){
  $("#join_server").show();
  $("#error2").hide();

  $("#join_server").addClass("fade-in");
  $("#join_server").removeClass("fade-out");

  $("#join_server .sub_div").removeClass("scale-out-center");
  $("#join_server .sub_div").addClass("scale-up-center");
}

function hideServerJoin(){
  $("#join_server .sub_div").removeClass("scale-up-center");
  $("#join_server .sub_div").addClass("scale-out-center");

  $("#join_server").addClass("fade-out");
  $("#join_server").removeClass("fade-in");

  setTimeout(function(){
    $("#join_server .sub_div").removeClass("scale-out-center");
    $("#join_server").hide();
    $("#error2").hide();
  }, 350);
}

$('#server_join_form_submit').click(function(e) {
  e.preventDefault();
  
  var serverName = $("#join_server_name").val();
  $('#join_server_name').val('');

  if(serverName.includes("/")){
    $("#error2").show();
  }else{
    $("#error2").hide();

    serverList(serverName);
    //hideServerJoin();
  }
});

function serverList(serverName) {
  var servers = [];
  var descriptions = [];
  var server_ids = [];
  var icons = [];
  var yours = [];

  var parent = document.getElementById("server_search_results");

  while(parent.firstChild){
    parent.removeChild(parent.firstChild);
  }
  
  db.collection("groups/").where("name", "==", serverName).get()
    .then(querySnapshot =>{
        querySnapshot.forEach(doc => {
            servers.push(doc.data().name);
            descriptions.push(doc.data().desc);
            server_ids.push(doc.id);

            if(connectable_servers.includes(doc.id)){
              yours.push("1");
            }else {
              yours.push("0");
            }

            console.log(doc.data().name);
        });

      if(servers.length === icons.length){
        var nothing = document.createElement("h1");
            nothing.innerHTML = "No Results Found";
        
        parent.append(nothing);
      }else {
        for(var i = 0; i < servers.length; i++){
          var result = document.createElement("div");
              result.classList.add("result");
              result.setAttribute('onclick', 'sendRequest("' + server_ids[i] + '", ' + '"Need to add!"' + ', "' + serverName + '")');

          var divider = document.createElement("div");

          var title = document.createElement("h1");
              title.innerHTML = servers[i];
          
          var descr = document.createElement("p");
              descr.innerHTML = descriptions[i];

          var verif = document.createElement("i");
              verif.classList.add("fas");
              verif.classList.add("fa-check-circle");
              verif.style.color = "var(--text-link)";

          var appart = document.createElement("i");
              appart.classList.add("fas");
              appart.classList.add("fa-check");

          

          divider.append(title);
          divider.append(descr);

          result.append(divider);

          if(yours[i] == "1"){
            result.append(appart);
            //result.append(verif);
          }

          parent.append(result);
        }
      }
    }); 
}

function sendRequest(serverID, join_message, serverName){
  if(connectable_servers.includes(serverID)){
    console.log("You are already a part of this server!");
    showUnsucessfullJoin(serverName);
  }else{
    var now = new Date();

    db.collection("groups/"+ serverID + "/requests").doc(user_id).set({
        requestee: username,
        requestee_id: user_id,
        message: join_message,
        timestamp: now
    }).then(function() {
        console.log("Server join request sent!");
        hideServerJoin();
        showSucessfullJoin(serverName);
    });
  }
}

function showSucessfullJoin(serverName) {
  $("#success_join").css('opacity', '0');
  $("#success_join_title").html("Sucessfully sent request to server  '<strong> " + serverName +"</strong>'");
  $("#success_join").show();

  setTimeout(function(){
    $("#success_join").css('opacity', '1');
    
  }, 100);

  setTimeout(hideSucessfullJoin, 5000);
}

function showUnsucessfullJoin(serverName) {
  $("#success_join").css('opacity', '0');
  $("#success_join_title").html("You are already appart of  '<strong> " + serverName +"</strong>'");
  $("#success_join").show();

  setTimeout(function(){
    $("#success_join").css('opacity', '1');
    
  }, 100);

  setTimeout(hideSucessfullJoin, 5000);
}

function hideSucessfullJoin(){
  $("#success_join").css('opacity', '0');

  setTimeout(function(){
    $("#success_join").hide();
  }, 2000);
}

function createServer(serverName){
    
    let autoID = db.collection("groups").doc().id;
    var description = $("#create_server_description").val();

    db.collection("groups").doc(autoID).set({
      name: serverName,
      desc: description
    }).then(function() {
        console.log("Server " + serverName + " is beging created");
    });

    var now = new Date();

    db.collection("groups/"+ autoID +"/messages").doc("1").set({
        sender: "Server",
        senderId: "1",
        message: "Welcome to <strong>" + serverName + "</strong>.",
        timestamp: now
    }).then(function() {
        console.log("Server created!");

        var user_servers = db.collection("users").doc(user_id);
        console.log(user_servers.servers);

        //var docRef = db.collection("users").doc(user_id);

        //docRef.get()
        
        
        return user_servers.update({
          servers: firebase.firestore.FieldValue.arrayUnion(autoID)
        })
    });

    db.collection("groups/"+ autoID +"/members").doc(user_id).set({
      userId: user_id,
      username: username
    }).then(function() {
      console.log("Server's Users Set!");
    });

    db.collection("groups/"+ autoID +"/roles").doc("owner").set({
      colour: "gold",
      colour_rgb: "rgb(255,215,0)",
      perm_lvl: 10
    })
    
    db.collection("groups/"+ autoID +"/roles").doc("all").set({
      colour: "ping",
      colour_rgb: "null",
      perm_lvl: 0
    }).then(function() {
      console.log("Server's Roles Setup!");

      var user_roles = db.collection("groups/" + autoID + "/members").doc(user_id);

      return user_roles.update({
        roles: firebase.firestore.FieldValue.arrayUnion("owner", "all")
      })

    });

    createServerNav();
}

function leaveRoom(){
    while(document.getElementById("message-container").firstChild){
        document.getElementById("message-container").removeChild( document.getElementById("message-container").firstChild);
    }
    
    $("#" + room).find("span:first").addClass("pill_hidden");
    $("#" + room).find("span:first").removeClass("pill");
    $("#" + room).find("img").removeClass("list_item_active");

    while(messages.length > 0) {
      messages.pop();
      authors.pop();
      dates.pop();
      userId_message.pop();
      serverMembers.pop();
      roles.pop();
      rolecolours.pop();
      
    }
}

function loadServerID(room_id_element){

    db.collection("groups/").get()
    .then(querySnapshot =>{
        querySnapshot.forEach(doc => {
            var doc_name = doc.data().name;
            //console.log(doc.data());
            //console.log(doc.id);

            if(doc_name){
              //console.log(doc_name.toLowerCase() + " or " + room_id_element);
            }

            var continueto = true;

            if(doc_name){
                if(doc_name.toLowerCase() == room_id_element){
                    //console.log(doc.id);
                    rmid = doc.id;
                    //console.log(rmid); 
                    continueto = false;
                    //console.log("GO GO GO!!! " + rmid);
                    joinServer(room_id_element);
                }else {
                    if(continueto == false){
                        //console.log("Goddamn!{");
                        //console.log(doc.id);
                        rmid = "invalid";
                        //console.log(rmid);
                        //console.log("}");
                    }else{

                    }
                }
            }else {
                rmid = "invalid";
               //console.log("Goddamn!");
            }
        });
    }); 
}

function joinServer(room_id_element){
    $("#serverMoreInfo").show();

    rmid = room_id_element;
    var servername;
    var serverRef = db.collection("groups").doc(rmid);

    serverRef.get().then(function(doc) {
      human_room = doc.data().name;

      document.getElementById("message-input").placeholder = "Message " + human_room + " as " + username;
      document.getElementById("serverName").innerHTML = human_room;

      if(document.getElementById("serverName").innerHTML.length >= 13){
        document.getElementById("serverName").innerHTML = document.getElementById("serverName").innerHTML.substr(0,15) + "...";
      }
    });

    hideServerMenu();
    $("#lobby").hide();
    //console.log("3,2,1 LIFTING OFF WITH ID OF " + rmid);
    //updateTyping();


    var sender = "";
    var msge = "";
    var time = "";
    var senderIdentification = "";

    if(rmid){
        db.collection("groups/"+ rmid +"/messages").orderBy("timestamp", "desc").limit(100).get()
        .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                //console.log("Hey");
                //console.log(doc.id, " => ", doc.data());
                sender = doc.data().sender;
                authors.push(doc.data().sender);
                //console.log(sender);
                senderIdentification = doc.data().senderId;
                userId_message.push(doc.data().senderId);
                //console.log(senderIdentification);
                msge = doc.data().message;
                messages.push(doc.data().message);
                //console.log(msge);
                time = formatDate(doc.data().timestamp.toDate());
                dates.push(formatDate(doc.data().timestamp.toDate()));
                //console.log(time);

                //console.log("printing - " + ammount);
                var someElementsItems = document.querySelectorAll(".user_refrence");
              /*
                if($("#message-container").children().length > 0){
                    if(someElementsItems[someElementsItems.length - 1].innerHTML === sender){
                        $("#message-container").append($('<p>').text(msge));
                    }else{
                        $("#message-container").append($('<br>'));
                        $("#message-container").append($('<hr>'));
                        $("#message-container").append($('<br>'));
                        //$("#message-container").append($('<img src="public/'+ user +'.jpg">'));
                        // $("#message-container").append($('<img src="' + user_img +'">'));  GET SENDERS PROFILE PIC
                        $("#message-container").append($('<h2 class="user_refrence">').text(sender));
                        $("#message-container").append($('<h3>').text(time));
                        $("#message-container").append($('<p>').text(msge));
                    }
                }else{
                        $("#message-container").append($('<br>'));
                        //$("#message-container").append($('<img src="' + user_img +'">'));
                        $("#message-container").append($('<h2 class="user_refrence">').text(sender));
                        $("#message-container").append($('<h3>').text(time));
                        $("#message-container").append($('<p>').text(msge));
                }
                */
            });

            authors.reverse();
            userId_message.reverse();
            messages.reverse();
            dates.reverse();

            updateMessages("null");
            updateTyping();
            renderMessages();
        });


        db.collection("groups/"+ rmid +"/members").get()
        .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                serverMembers.push(doc.data().username);
            });
        });

        db.collection("groups/"+ rmid +"/roles").get()
        .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                //console.log(doc.data());
                roles.push(doc.id);
                rolecolours.push(doc.data().colour);
            });
        });

        renderMembersList();
      
    }

    if(room_id_element){
        $("#" + room_id_element).find("span").removeClass("pill_hidden");
        $("#" + room_id_element).find("div span").addClass("pill");
        $("#" + room_id_element).find("img").addClass("list_item_active");
        //console.log("Added 'PILL' to " + room_id_element);
    }

    var image_src = $("#" + room_id_element).find("img").attr('src');
    document.getElementById("header").style.backgroundImage = "linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0)), url('" + image_src + "')";
}

function renderMessages(){
    if(messages.length < 2){
    }else{
      /* Remove the first element from all arrays due to M2SC Bug
      messages.splice(0,1);
      authors.splice(0,1);
      dates.splice(0,1);
      userId_message.splice(0,1);
      typing_local.splice(0,1);
      empty.splice(0,1);*/
    }

    while(document.getElementById("message-container").firstChild){
      document.getElementById("message-container").removeChild( document.getElementById("message-container").firstChild);
    }

    /* Remove the first element from all arrays due to M2SC Bug
      messages.splice(0,1);
      authors.splice(0,1);
      dates.splice(0,1);
      userId_message.splice(0,1);
      typing_local.splice(0,1);
      empty.splice(0,1);
    */

    //console.log("Rendering!");
    var someElementsItems = document.querySelectorAll(".user_refrence");
    var samecount = 0;

    for(var i = 0; i < messages.length; i++){
      var highlight_color = "deafult";
      var divider = document.createElement("div");
          divider.classList.add("message");

      if(messages[i].includes("@")){
        var str = messages[i];

        var n = str.search("@");
        var res = str.split("@", 2);
        var result = res[1].split(" ", 2);
        var k = str.search(" ");
        //console.log(result[0]);

        //var resulti = res[0] + "<b>@" + result[0] + "</b>";
        
        /*
        if(result.length == 1){

        }else{
          for(var i = 0; i <= result.length; i++){
            resulti += result[i];
          }
        }
        */
        
        p = roles.indexOf(result[0]);
        //console.log(resulti);
        //console.log(result.length);

        if(p != -1){
          highlight_color = rolecolours[p];
        }else{
          highlight_color = "deafult";
        }
        
      }else{
        highlight_color = "deafult";
      }

      if($("#message-container").children().length > 0){
        if(highlight_color !== "deafult"){
          if(authors[i - 1] === authors[i] && samecount < 10){
                var message = document.createElement("p");
                    message.innerHTML = messages[i];
                
                if(highlight_color == "ping"){
                  divider.classList.add("mentioned"); 
                }else if(highlight_color == "light_blue"){
                  divider.classList.add("highlighted");
                }else if(highlight_color == "gold"){
                  divider.classList.add("owner");
                }
                 
                divider.append(message);
                samecount++;
            }else{
                //$("#message-container").append($('<br>'));
                //$("#message-container").append($('<hr>'));
                $("#message-container").append($('<br>'));
                //$("#message-container").append($('<img src="public/'+ user +'.jpg">'));
                // $("#message-container").append($('<img src="' + user_img +'">'));  GET SENDERS PROFILE PIC
                var author = document.createElement("h2");
                    author.classList.add("user_refrence");
                    author.innerHTML = authors[i];
                
                var date = document.createElement("h3");
                    date.innerHTML = dates[i];
                
                var message = document.createElement("p");
                    message.innerHTML = messages[i];
                
                divider.append(author);
                divider.append(date);
                divider.append(message);

                if(highlight_color == "ping"){
                  divider.classList.add("mentioned"); 
                }else if(highlight_color == "light_blue"){
                  divider.classList.add("highlighted");
                }else if(highlight_color == "gold"){
                  divider.classList.add("owner");
                }

                samecount = 0;
                
            }
        }else{
          if(authors[i - 1] === authors[i] && samecount < 10){
                var message = document.createElement("p");
                    message.innerHTML = messages[i];
                  
                divider.append(message);
                samecount++;
            }else{
                //$("#message-container").append($('<br>'));
                //$("#message-container").append($('<hr>'));
                $("#message-container").append($('<br>'));
                //$("#message-container").append($('<img src="public/'+ user +'.jpg">'));
                // $("#message-container").append($('<img src="' + user_img +'">'));  GET SENDERS PROFILE PIC
                var author = document.createElement("h2");
                    author.classList.add("user_refrence");
                    author.innerHTML = authors[i];
                
                var date = document.createElement("h3");
                    date.innerHTML = dates[i];
                
                var message = document.createElement("p");
                    message.innerHTML = messages[i];
                
                divider.append(author);
                divider.append(date);
                divider.append(message);
                samecount = 0;
                
            }
        }
            
      }else{
              $("#message-container").append($('<br>'));
              //$("#message-container").append($('<img src="' + user_img +'">'));
              var author = document.createElement("h2");
                  author.classList.add("user_refrence");
                  author.innerHTML = authors[i];
              
              var date = document.createElement("h3");
                  date.innerHTML = dates[i];
              
              var message = document.createElement("p");
                  message.innerHTML = messages[i];
              
              divider.append(author);
              divider.append(date);
              divider.append(message);
              samecount = 0;
      }

      $("#message-container").append(divider);
    }

    var elem = document.getElementById("message-container");
    elem.scrollTop = elem.scrollHeight;
}

function toUpper(input){
    human_room = input[0].toUpperCase() + input.slice(1); 
    return human_room;
}

function formatDate(input){
    var output = input.toLocaleDateString();
    return output;
}


$('#send-container').submit(function(e){
    e.preventDefault();
    sendMessage();
    $('#message-input').val('');
    return false;
});


$("body").on("mouseenter",".list_item",function(){   
    $this = $(this);
    
    if($this.find("img").hasClass("list_item_active")){
        //console.log("Has Class Already");
    }else{
        $this.find("img").addClass("list_item_active");
        $this.find("div span").addClass("pill_hover");
    }
}).on("mouseleave",".list_item",function(){   
    $this = $(this);
    $this.find("img").removeClass("list_item_active");
    $this.find("div span").removeClass("pill_hover");

    if(this.id === room || this.id === "lobby_link"){
        $this.find("img").addClass("list_item_active");
    }else{
        //console.log("Hey", this.id, ". You just got hovered but werent active :("); 
    }
});

/*
$(".list_item").mouseenter(function () {
    $this = $(this);
    $this.find("span").addClass("pill_hover");
    
    if($this.find("img").hasClass("list_item_active")){
        //console.log("Has Class Already");
    }else{
        $this.find("img").addClass("list_item_active");
    }
        
}).mouseleave(function (){
    $this = $(this);
    $this.find("img").removeClass("list_item_active");
    $this.find("span").removeClass("pill_hover");

    if(this.id === room){
        $this.find("img").addClass("list_item_active");
    }else{
        //console.log("Hey", this.id, ". You just got hovered but werent active :("); 
    }
});
*/

$("#message-input").on('focus', function () {
  //let autoID = db.collection("groups/"+ rmid +"/typing").doc().id;


  if(room !== "lobby_link"){
    db.collection("groups/"+ rmid +"/typing").doc(user_id).set({
      userId: user_id,
      name: username
    }).then(function() {  
        //console.log("Typing created");
    });
  }
  
  //updateTyping();
});

$("#message-input").on('focusout', function () {
  if(room !== "lobby_link"){
    db.collection("groups/"+ rmid +"/typing").doc(user_id).delete().then(function() {
      //console.log("Document successfully deleted!");
    }).catch(function(error) {
        console.error("Error removing document: ", error);
    });
  }
});

function updateTyping(){
    while(typing_local.length > 0) {
      typing_local.pop();
    }

    if(room == "lobby_link"){
 
    }else{
      db.collection("groups/"+ rmid +"/typing").limit(4)
        .onSnapshot( querySnapshot => {
            while(typing_local.length > 0) {
              typing_local.pop();
            }

            querySnapshot.forEach(doc => {
              //console.log(doc);
              //console.log(doc.data().name);
              typing_local.push(doc.data().name);
            });

            //console.log(typing_local);
            var final = "";

            if(typing_local.length === 1){
              $("#isTypingID").text(typing_local[0] + " is typing");
            }else if(typing_local.length === 2){
              final = typing_local[0] + " and " + typing_local[1];
              $("#isTypingID").text(final + " are typing");
            }else if(typing_local.length === 3){
              final = typing_local[0] + " , " + typing_local[1] + " and " + typing_local[2];
              $("#isTypingID").text(final + " are typing");
            }else if(typing_local.length === 4){
              final = typing_local[0] + " , " + typing_local[1] + " , " + typing_local[2] + " and " + typing_local[3];
              $("#isTypingID").text(final + " are typing");
            }else if(typing_local.length > 4){
              final = typing_local[0] + " , " + typing_local[1] + " , " + typing_local[2] + " , " + typing_local[3] + " and others";
              $("#isTypingID").text(final + " are typing");
            }else{
              final = "no one is typing :(";
              $("#isTypingID").text(final);
            }

            if(typing_local.length > 0){
              $("#isTypingID").addClass("isTyping");
              $("#isTypingID").removeClass("isTyping_hid");
            }else{
              $("#isTypingID").removeClass("isTyping");
              $("#isTypingID").addClass("isTyping_hid");
            }
        });
    }
}

function updateMessages(usersid){
  if(room !== "lobby_link"){
    db.collection("groups").doc(rmid).collection("messages").orderBy("timestamp", "desc").limit(1)
    .onSnapshot(function(querySnapshot) {
      //console.log("new one down the pipe!");
      querySnapshot.forEach(function(doc) {

          var leng = messages.length - 1;

          if(doc.data().message == messages[leng]){

          }else{
            //console.log(doc.data().message + " | " + messages[leng]);
            //console.log(doc.data().timestamp + " | " + dates[leng]);

            sender = doc.data().sender;
            authors.push(doc.data().sender);
            //console.log(sender);
            senderIdentification = doc.data().senderId;
            userId_message.push(doc.data().senderId);
            //console.log(senderIdentification);
            msge = doc.data().message;
            messages.push(doc.data().message);
            //console.log(msge);
            time = formatDate(doc.data().timestamp.toDate());
            dates.push(formatDate(doc.data().timestamp.toDate()));
          }
      });

      renderMessages();
    });
  }else {
    db.collection("users/" + user_id + "/direct_messages/" + usersid + "/messages").orderBy("timestamp", "desc").limit(1)
    .onSnapshot(function(querySnapshot) {
      //console.log("new one down the pipe!");
      querySnapshot.forEach(function(doc) {

          var leng = messages.length - 1;

          if(doc.data().message == messages[leng]){

          }else{
            //console.log(doc.data().message + " | " + messages[leng]);
            //console.log(doc.data().timestamp + " | " + dates[leng]);

            sender = doc.data().sender;
            authors.push(doc.data().sender);
            //console.log(sender);
            senderIdentification = doc.data().senderId;
            userId_message.push(doc.data().senderId);
            //console.log(senderIdentification);
            msge = doc.data().message;
            messages.push(doc.data().message);
            //console.log(msge);
            time = formatDate(doc.data().timestamp.toDate());
            dates.push(formatDate(doc.data().timestamp.toDate()));
          }
      });

      renderMessages();
    });
  }
}

$("#patch_notes_black").click(function(event){
  if($(event.target).is("#patch_notes_black")){
    $("#patch_notes_black").hide();
  }
});



function closeForm(){
  setTimeout(function(){
    //$("html").addClass("blooop_out");
    $("#loader").addClass("hidden");
  }, 1000);
  
 setTimeout(function(){
    //$("html").removeClass("blooop_out");
  }, 2000);
  
}

function openForm(){
  $("html").addClass("blooop_in");
  
 setTimeout(function(){
      $("html").removeClass("blooop_in");
  }, 1000);
}

const toggleTheme = document.querySelector("#toggle-theme");

toggleTheme.addEventListener('click', e => {
  console.log("Switching theme");
  if(document.documentElement.hasAttribute('theme')){
    document.documentElement.removeAttribute('theme');
  }
  else{
    document.documentElement.setAttribute('theme', 'light');
  }
});

function lightTheme(){
  document.documentElement.setAttribute('theme', 'light');
}

const toggleMembers = document.querySelector("#toggle_members");

toggleMembers.addEventListener('click', e => {
  $("#members").toggle();
});


/* Add Member Toggle Fully.

$("#serverMoreInfo").click(function() {
  if(room !== "lobby_link"){
    toggleServerMenu();
  }
});

$("#serverName").click(function() {
  if(room !== "lobby_link"){
    toggleServerMenu();
  }
});
*/

$("#header a").click(function() {
  if(room !== "lobby_link"){
    toggleServerMenu();
  }
});

$("#header a i").click(function() {
  if(room !== "lobby_link"){
    toggleServerMenu();
  }
});

$("#header p").click(function() {
  if(room !== "lobby_link"){
    toggleServerMenu();
  }
});

var serverMenu_hid = true;

function toggleServerMenu(){
  $("#serverMenu").toggle();
  $("#serverMoreInfo").toggleClass("exit");

  serverMenu_hid = !serverMenu_hid;
}

function hideServerMenu(){
  $("#serverMenu").hide();
  $("#serverMoreInfo").removeClass("exit");
  serverMenu_hid = true;
}

$('body').click(function(event) {
  if(serverMenu_hid == false){
    console.log("HEY!");

    if(!$(event.target).is('#serverMenu')){
      hideServerMenu();
    }

  }else if($(event.target).is("#header") && room !== "lobby_link"){
    toggleServerMenu();
    console.log($(event.target));
  }
});

$("#close_settings").click(function() {
  hideSettings();
});

$("#user_settings").click(function() {
  showSettings();
});

function showSettings() {
  $("#settings").show();
  $("settings_right *").hide();
  $("account").show();
}

function hideSettings() {
  $("#settings").hide();
}

$("#server_members_button").click(function(){
  showMembers();
});

$("#close_member_managment").click(function(){
  hideMembers();
});

$("#show_requests").click(function(){
  $("#member_requests").show();
  $("#member_managment").hide();
  $("#member_invite").hide();

  $("#show_requests").addClass("active_member_manage");
  $("#show_managment").removeClass("active_member_manage");
  $("#show_invite").removeClass("active_member_manage");

  getRequests();
});

$("#show_managment").click(function(){
  $("#member_requests").hide();
  $("#member_managment").show();
  $("#member_invite").hide();

  $("#show_requests").removeClass("active_member_manage");
  $("#show_managment").addClass("active_member_manage");
  $("#show_invite").removeClass("active_member_manage");

  renderMemberList();
});

$("#show_invite").click(function(){
  $("#member_requests").hide();
  $("#member_managment").hide();
  $("#member_invite").show();

  $("#show_requests").removeClass("active_member_manage");
  $("#show_managment").removeClass("active_member_manage");
  $("#show_invite").addClass("active_member_manage");

  renderInvite();
});

function getRequests() {
  while(document.getElementById("member_requests").firstChild){
    document.getElementById("member_requests").removeChild( document.getElementById("member_requests").firstChild);
  }

  var have = 0;

  var requests_names = [];
  var requests_desc = [];
  var requests_id = [];
  var requests_date = [];

  db.collection("groups/"+ rmid +"/requests").get()
  .then(querySnapshot => {
      querySnapshot.forEach(doc => {
          requests_names.push(doc.data().requestee);
          requests_desc.push(doc.data().message);
          requests_id.push(doc.data().requestee_id);
          requests_date.push(doc.data().timestamp);
          have++;
      });

      for(var i = 0; i < requests_names.length; i++){
        var request_div = document.createElement("div");
            request_div.classList.add("request");
        
        var requestee_name = document.createElement("h1");
            requestee_name.innerHTML = requests_names[i];
        
        var requestee_description = document.createElement("p");
            requestee_description.innerHTML = requests_desc[i];
        
        var accept_button = document.createElement("button");
            accept_button.classList.add("accept");
            accept_button.innerHTML = "Accept";
            accept_button.setAttribute('onclick', 'acceptMember("'+ requests_id[i] +'", "'+ requests_names[i] +'")');

        var decline_button = document.createElement("button");
            decline_button.classList.add("decline");
            decline_button.innerHTML = "Decline";
            decline_button.setAttribute('onclick', 'declineMember("'+ requests_id[i] +'", "'+ requests_names[i] +'")');

        request_div.append(requestee_name);
        request_div.append(requestee_description);
        request_div.append(accept_button);
        request_div.append(decline_button);
        document.getElementById("member_requests").append(request_div);
      }
  });

  if(have == 0){
    var fail_to_create = document.createElement("h1");
        fail_to_create.innerHTML = "No Requests :(";
    
    document.getElementById("member_requests").append(fail_to_create);
  }
}

function serverInviteAccept(user_id, server_id, server_name) {
  db.collection("groups/"+ server_id +"/members").doc(user_id).set({
    roles: ["all"],
    userId: user_id,
    username: user_name
  }).then(function() {
    showSuccessfulJoin(server_name)
  });

  var users_servers = db.collection("users").doc(user_id);

  return users_servers.update({
    servers: firebase.firestore.FieldValue.arrayUnion(rmid)
  });
}

function showSuccessfulJoin(server) {
  $("#success_add").css('opacity', '0');
  $("#success_add_title").html("Sucessfully joined " + server);
  $("#success_add").show();

  setTimeout(function(){
    $("#success_add").css('opacity', '1');
    
  }, 100);

  setTimeout(hideSucessfullAdd, 5000);
}

function acceptMember(user_id, user_name){
  db.collection("groups/"+ rmid +"/members").doc(user_id).set({
    roles: ["all"],
    userId: user_id,
    username: user_name
  }).then(function() {
    declineMember(user_id, user_name);
    showSucessfullAdd(user_name);
  });

  var users_servers = db.collection("users").doc(user_id);

  return users_servers.update({
    servers: firebase.firestore.FieldValue.arrayUnion(rmid)
  });
}

function declineMember(user_id, user_name) {
  db.collection("groups/"+ rmid +"/requests").doc(user_id).delete().then(function() {
    console.log("Document successfully deleted!");
  }).catch(function(error) {
      console.error("Error removing document: ", error);
  });

  getRequests();
}

function showSucessfullAdd(member) {
  $("#success_add").css('opacity', '0');
  $("#success_add_title").html("Sucessfully accepted " + member);
  $("#success_add").show();

  setTimeout(function(){
    $("#success_add").css('opacity', '1');
    
  }, 100);

  setTimeout(hideSucessfullAdd, 5000);
}

function hideSucessfullAdd(){
  $("#success_add").css('opacity', '0');

  setTimeout(function(){
    $("#success_add").hide();
  }, 2000);
}

function renderMemberList(){

}

function renderInvite(){

}


function showMembers() {
  $("#member_manage_par").show();

  $("#member_requests").hide();
  $("#member_managment").hide();
  $("#member_invite").show();
}

function hideMembers() {
  $("#member_manage_par").hide();
}

function renderMembersList() {
  var parent = document.getElementById("members");

  while(parent.firstChild){
    parent.removeChild( parent.firstChild);
  }

  // Pre-Breaker
  var breaker = document.createElement("br");
  var breaker2 = document.createElement("br");
  var breaker3 = document.createElement("br");
  var breaker4 = document.createElement("br");

  parent.append(breaker);
  parent.append(breaker2);
  parent.append(breaker3);
  parent.append(breaker4);

/*
  var groups = document.createElement("h4");

  for(var i = 0; i < roles.length; i++){
    groups.innerHTML = roles[i];
    parent.append(groups);
  }
*/

  var members = [];
  var membersId = [];

  db.collection("groups/"+ rmid +"/members").get()
  .then(querySnapshot => {
    querySnapshot.forEach(doc => {
        members.push(doc.data().username);
        membersId.push(doc.data().userId);
    });

    for(var i = 0; i < members.length; i++){
      var member_user = document.createElement("div");
          member_user.classList.add("member_user");
          member_user.setAttribute("onclick", "userInfo('" + membersId[i] + "')");

      var member_icon = document.createElement("div");
          member_icon.classList.add("member_icon");

      var image = document.createElement("img");
          image.src = "https://i.pinimg.com/originals/fc/68/f8/fc68f86873c9c661e84ad442cf8fb6cf.gif";
          image.classList.add("user_name_img");
      
      var status = document.createElement("div");
          status.classList.add("online");            /// CHANGE STATUS FROM STATUS PULL QUERY LATER 
      
      member_icon.append(image);
      member_icon.append(status);

      var user_info = document.createElement("div");
      
      var users_name_member = document.createElement("h1");
          users_name_member.innerHTML = members[i];
      
      var users_documented_status = document.createElement("h3");
          users_documented_status.innerHTML = "TEMPLATE";

      user_info.append(users_name_member);
      user_info.append(users_documented_status);


      member_user.append(member_icon);
      member_user.append(user_info);
      parent.append(member_user);
    }
  });
}

function userInfo(users_id) {
  var users_name;
  var user_time;
  var users_servers = [];

  var docRef = db.collection("users").doc(users_id);

  docRef.get().then(function(doc) {
    if (doc.exists) {
        users_name = doc.data().username;
        user_time = doc.data().creationDate;
        users_servers.push(doc.data().servers);
        users_id_ = doc.id

        console.log(doc.data());

        renderUserInfo(users_name, user_time, users_servers, users_id_);
    } else {
        console.log("No such document!");
    }
  }).catch(function(error) {
      console.log("Error getting document:", error);
  }); 
}

function renderUserInfo(users_name, user_time, users_servers, users_id_){
  $("#user_card").show();
  $("#user_card").removeClass("fade-out");
  $("#user_card").addClass("fade-in");
  $("#user_card *").addClass("fade-in");

  while(document.getElementById("user_card").firstChild){
    document.getElementById("user_card").removeChild( document.getElementById("user_card").firstChild);
  }

  var parent = document.createElement("div");
      parent.classList.add("user_card");
      parent.id = "user_card_non_bg";

  // Top Half

  var top_patition = document.createElement("div");
      top_patition.classList.add("user_name_card_top_patition");

  var smaller_div = document.createElement("div");
      smaller_div.classList.add("user_card_naming");

  var users_name_popup = document.createElement("h2");
      users_name_popup.id = "user_name_card";

      if(users_name.length > 18){
        users_name_popup.innerHTML = users_name.substr(0,15) + "...";
      }else{
        users_name_popup.innerHTML = users_name;
      }

  var hash = document.createElement("p");
      hash.innerHTML = "#... TBD";

  var message_friend = document.createElement("button");
      message_friend.classList.add("message_friend");
      message_friend.id = "user_card_message_friend";
      message_friend.classList.remove("user_card_message_friend_activated");

  
  loadFriendsList();
  console.log(friends_user_ids, users_id_);

  if(friends_user_ids.includes(users_id_)){
    message_friend.innerHTML = "Send Message"; 
    message_friend.setAttribute('onclick', `loadConvo("${users_id_}", "${users_name}")`);
  }else {
    message_friend.innerHTML = "Add Friend"; 
    message_friend.setAttribute('onclick', `addFriend("${users_id_}", "${users_name}")`);
  }

  var more_options = document.createElement("a");

  var icon_more_options = document.createElement("i");
      icon_more_options.classList.add("fas");
      icon_more_options.classList.add("fa-ellipsis-v");

  /* Middle Half 

  var middle_partition = document.createElement("div");
      middle_partition.classList.add("user_name_card_middle_patition");

  var navigation_bar = document.createElement("div");

  var user_info = document.createElement("h2");
      user_info.innerHTML = "User Info";
  
  var mutual_servers = document.createElement("h2");
      mutual_servers.innerHTML = "Mutual Servers";
  
  var mutual_friends = document.createElement("h2");
      mutual_friends.innerHTML = "Mutual Friends";

  var more_options = document.createElement("a");

  */

  var bottom_partition = document.createElement("div");
      bottom_partition.classList.add("user_name_card_bottom_patition");
  
  var info = document.createElement("p");
      info.innerHTML = "Hey Mate, Ty for using Fortiude!";

  bottom_partition.append(info);
  
  more_options.append(icon_more_options);
  smaller_div.append(users_name_popup);
  smaller_div.append(hash);
  top_patition.append(smaller_div)
  top_patition.append(message_friend);
  top_patition.append(more_options);

  parent.append(top_patition);
  parent.append(bottom_partition);
  $("#user_card").append(parent);
  
  // CREATE USER CARD - FULLSCREEN BASE OF DISCORD FULLSCREEN.
}

function addFriend(friends_id, friends_name) {
  $("#user_card_message_friend").text("Added! 😃");
  $("#user_card_message_friend").addClass("user_card_message_friend_activated");

  // Continue ADD Friend Feature
  var now = new Date();

  db.collection("users/"+ user_id +"/friends").doc(friends_id).set({
    date: now,
    latest_interaction: now,
    name: friends_name
  }).then(function() {
    db.collection("users/"+ user_id +"/direct_messages").doc(friends_id).set({
      username: friends_name
    }).then(function() {
      db.collection("users/"+ user_id +"/direct_messages/" + friends_id + "/messages").doc("1").set({
        message: "Fortitude Welcomes you both! Have fun!",
        sender: "Fortitude",
        senderId: "1",
        timestamp: now
      }).then(function() {
        db.collection("users/"+ friends_id +"/friends").doc(user_id).set({
          date: now,
          latest_interaction: now,
          name: username
        }).then(function() {
          db.collection("users/"+ friends_id +"/direct_messages").doc(user_id).set({
            username: username
          }).then(function() {
            db.collection("users/"+ friends_id +"/direct_messages/" + user_id + "/messages").doc("1").set({
              message: "Fortitude Welcomes you both! Have fun!",
              sender: "Fortitude",
              senderId: "1",
              timestamp: now
            }).then(function() {
              loadConvo(friends_id, friends_name);
            });
          });
        });
      });
    });
  });
}

$("#user_card").click(function(event){
  if($(event.target).is("#user_card")){
    $("#user_card_non_bg").addClass("scale-out-center");

    setTimeout(function() {
      //$("#user_card_non_bg").addClass("fade-out");
    }, 200);

    $("#user_card").addClass("fade-out");
    $("#user_card").removeClass("fade-in");

    setTimeout(hideUserCard, 350);
  }
});

function hideUserCard() {
  $("#user_card").hide();
  $("#user_card_non_bg").removeClass("scale-out-center");
}

window.addEventListener('load', function () {
  if (window.Notification && Notification.permission !== "granted") {
    Notification.requestPermission(function (status) {
      if (Notification.permission !== status) {
        Notification.permission = status;
      }
    });
  }
});

function nodification(body, title, img){
  if (window.Notification && Notification.permission === "granted") {     
    var notify = new Notification(title, {
      body: body,
      icon: img,
    });
  }else if (window.Notification && Notification.permission !== "denied") {
    Notification.requestPermission(function (status) {
      if (status === "granted") {
        var notify = new Notification(title, {
          body: body,
          icon: img,
        });
      }
    });
  }
};