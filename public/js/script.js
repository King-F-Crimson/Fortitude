var username, user_email, is_emailVerified, icon, user_id;
var room = "lobby_link";
var rmid = "";
var human_room = "";
var user_img = "https://i.pinimg.com/originals/fc/68/f8/fc68f86873c9c661e84ad442cf8fb6cf.gif";

var connectable_servers = [];
var serverMembers = [];
var roles = [];
var role_names = [];
var rolecolours = [];

var friends_user_names = [];
var friends_user_ids = [];
var server_members = [];

var nav = false;
var loadingFriends = false;
let loadable = true;

let servers = [];

var dm_users_id = "";

messages = [];
authors = [];
dates = [];
complete_date = [];
userId_message = [];
typing_local = [];
empty = [];

var patch_notes;

if(localStorage.getItem("patch_notes")){
  patch_notes = localStorage.getItem("patch_notes");
}else{
  patch_notes = true;
  localStorage.setItem("patch_notes", patch_notes);
}

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

function getItem(key){
  //console.log("Retriving Cache");
  try{
      return JSON.parse(localStorage.getItem(key));
  }
  catch(e){
      return localStorage.getItem(key);
  }
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

firebase.firestore().settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

firebase.firestore().enablePersistence()


const messaging = firebase.messaging();
messaging.usePublicVapidKey("BJKm3rJ6LyCsCZW3DAtOF-7f1WPy68gR5nd81koJFVphgQrPNJR8rFmvcX9odNz8k6YvFfm_kE1tbWpldy9Q7io");

var messaging_token = collectToken();

async function collectToken() {
  await messaging.requestPermission();

  const token = await messaging.getToken();
  console.log(token);
  return token;
}

messaging.onMessage((content) => {
  console.log('Message Recieved', content);
});

messaging.onTokenRefresh((content) => {
  token = content;
});


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

        var docRef = db.collection("users").doc(user_id);
        var image_source = "";
        var ur2 = "";
        docRef.get().then(function(doca) {
            image_source = doca.data().icon;

            var storageRef = firebase.storage().ref("userIcons/").child(image_source).getDownloadURL().then(function(url) {
              ur2 = url;
              server_members.push({name: username, info: [], uid: user_id, icon: url});
              $("#user_name_img").attr("src", url);

              removeDuplicates();

              localStorage.setItem("1", JSON.stringify(server_members));
            });
        });

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

function removeDuplicates() {
  server_members = Array.from(new Set(server_members.map(a => a.uid)))
  .map(id => {
    return server_members.find(a => a.uid === id)
  })
}

function removeDuplicateServer() {
  servers = Array.from(new Set(servers.map(a => a.sid)))
  .map(id => {
    return servers.find(a => a.sid === id)
  })
}

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
            //console.log(error);
        });
        
        username = designated_dspln;
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

        location.reload();
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
        location.reload();
        loadUserInfo(user);
    }).catch(err => {
        loginForm.querySelector(".error").classList.remove("hidden");
        loginForm.querySelector(".error").innerHTML = err.message;
    });
});

var loaded = false;

function loadUserInfo(user) {
  if(!loaded){
    
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
      
      console.log("Loading UI");

      closeLoader();
  }
}

function closeLoader(){

  if(!patch_notes || patch_notes == "false"){
    $("#patch_notes_black").hide();
  }else{
    patch_notes = false;
    localStorage.setItem("patch_notes", patch_notes);
  }
  
  setTimeout(function(){
      $("#loader").find("p").text("Having a good time!");
      loaded = true;
      setTimeout(function(){
        $("#loader").find("p").text("Logging In");
        
        
        var docRef = db.collection("users").doc(user_id);
        
        docRef.get().then(function(doc) {
            if (doc.exists) {
                
                //console.log("Document data:", doc.data());

                for(var i = 0; i < doc.data().servers.length; i++){
                  connectable_servers.push(doc.data().servers[i]);
                }  
            } else {
                // doc.data() will be undefined in this case
                //console.log("No such document!");
            }

           createServerNav();
           
            
        }).catch(function(error) {
            //console.log("Error getting document:", error);
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
      var storageRef = firebase.storage().ref("serverIcons/").child(doc.data().icon).getDownloadURL().then(function(url) {
        var this_server = {sid: doc.id, icon: url, info: doc.data(), channels: [], roles: []};
        servers.push(this_server);

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
            image.src = url;
            image.classList.add("list_item_image");
        

        var tooltip = document.createElement("span");
            tooltip.classList.add("tooltiptext");
            tooltip.innerHTML = doc.data().name;

        
        small_div.appendChild(pill_span);
        total_div.appendChild(small_div);    

        total_div.appendChild(image);
        total_div.appendChild(tooltip);

        document.getElementById("navigation").appendChild(total_div);

        if(i === connectable_servers.length){
          setTimeout(completeNav, 500);
        }
      }); 
    });
  }

  if(connectable_servers.length == 0){
    setTimeout(completeNav, 500);
  }
}

function completeNav() {
  if(!nav){
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

    nav = true;
  }
}

function enableAnimation() {

    // Hide all Hidden Elements. E8HIDEPOINTERHUB

    if(getItem("1")){
      //server_members = getItem("1");
    }
    
    hideServerCreator();
    hideServerJoin();
    hideSucessfullJoin();
    hideServerMenu();
    hideChannelSettings();
    hideSettings();
    hideMembers();
    hideServerSettings();
    hideSucessfullAdd();
    loadDM();
    loadNews();

    removeDuplicates();
    
    $("#user_card").hide();   

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

    msg = msg.replace(/>/g,"&#62;");
    msg = msg.replace(/</g,"&#60;");

    if(rmid !== "invalid"){
      if(room !== "lobby_link"){
        let autoID = db.collection("groups/"+ rmid +"/messages").doc().id;

        db.collection("groups/"+ rmid +"/channels/" + channel + "/messages").doc(autoID).set({
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

        db.collection("users/"+ user_id +"/friends/").doc(dm_users_id).update({
          latest_interaction: now,
        }).then(function() {
          //console.log("Updated!");
        });

        let autoID2 = db.collection("users/"+ dm_users_id +"/direct_messages/" + user_id + "/messages").doc().id;

        db.collection("users/"+ dm_users_id +"/direct_messages/" + user_id + "/messages").doc(autoID2).set({
          sender: username,
          senderId: user_id,
          message: msg,
          timestamp: now
        }).then(function() {
            //console.log("Message created");
        });

        db.collection("users/"+ dm_users_id +"/friends/").doc(user_id).update({
          latest_interaction: now,
        }).then(function() {
          //console.log("Updated!");
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
  //document.getElementById("header").style.backgroundImage = "linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0)), url('" + "https://media3.giphy.com/media/b29IZK1dP4aWs/giphy.gif" + "')";
  
  $("#serverName").text("Direct Messages");
  $("#channel_con").text("Direct Messages");
  $("#channel_con_des").hide();
  $("#search_general").hide();
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
            
        document.getElementById("DM").append(direct_message_home);
        document.getElementById("DM").append(direct_message_friends);
        //document.getElementById("DM").append(direct_message_about);
        document.getElementById("DM").append(direct_message_message);

        

        for(var i = 0; i < usernames.length; i++){
          var index = server_members.findIndex(element => element.uid == userids[i]);

          if(userids[i] !== user_id){
            
            var usersname = document.createElement("p");
            var users_icon = document.createElement("img");
                users_icon.setAttribute("src", server_members[index].icon)

            if(usernames[i].length > 10){
              usersname.innerHTML = usernames[i].substr(0,10) + "...";
            }else{
              usersname.innerHTML = usernames[i];
            }
        
            var parent_div = document.createElement("div");
                parent_div.setAttribute('name', 'user_dm_able');
                parent_div.setAttribute('onclick', `loadConvo("${userids[i]}", "${usernames[i]}")`);
                parent_div.setAttribute('id', userids[i]);
                parent_div.classList.add("dm_element");
            
            parent_div.append(users_icon);
            parent_div.append(usersname);
            document.getElementById("DM").append(parent_div);
          }
        }


    });
}

function loadConvo(usersid, usersname_dm) {
    if(room !== "lobby_link"){
      loadDM(); 
    }

    room = "lobby_link";
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
      complete_date.pop();
    }

    $(".dm_element_active").removeClass("dm_element_active");

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
  $("#channel_con").text("Direct Messages");
  $("#channel_con_des").hide();
  $("#search_general").hide();
  $("#toggle_members").hide();

  $("#channels").hide();
  $("#members").hide();
  $("#DM").show();

  $("#channel_con").text("Friends");
  $("#channel_con_des").hide();

  $("#friends").show();
  $("#lobby").hide();
}

function loadFriendsList(){
  var usernames = [];
  var userids = [];

  loadingFriends = false;

  while(document.getElementById("friends").firstChild){
    document.getElementById("friends").removeChild(document.getElementById("friends").firstChild);
  }

  var server_member_manage_top = document.createElement("div");
  var friend_count = 0;
  var friends_title = document.createElement("h4");
      friends_title.id = "friends_count";

  var friends_div = document.createElement("div");

  db.collection("users/"+ user_id +"/friends").orderBy("latest_interaction", "desc").get()
    .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          friend_count++;
          //console.log(doc.data());
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
            //console.log(this_users_name);
            
            var storageRef = firebase.storage().ref("userIcons/").child(image_source).getDownloadURL().then(function(url) {
              ur2 = url;
              
              var index = server_members.findIndex(element => element.uid == doc.id);

              if(index < 0){
                server_members.push({name: doc.data().username, info: [], uid: doc.id, icon: ur2});
                localStorage.setItem("1", JSON.stringify(server_members));
              }

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
              friends_div.append(parent_div);
            });                 
          });
          setTimeout(loadingFriends = true, 1000);
        });

        friends_title.innerHTML = `FRIENDS - ${friend_count}`;
        friends_title.classList.add("friend");
        
        friends_div.append(friends_title);
        document.getElementById("friends").append(friends_div);
    });   
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
  $("#channel_con").text("Direct Messages");
  $("#channel_con_des").hide();
  $("#toggle_members").hide();

  $("#channels").hide();
  $("#members").hide();
  $("#DM").show();

  $("#channel_con_des").hide();

  $("#friends").hide();
  $("#lobby").show();
}

$("body").on("click",'div[name*="server_item"]',function(){  
    leaveRoom();

    //console.log("Attempting to connect to server: " + this.id);

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
      $("#channel_con_des").show();
      $("#search_general").show();
      $("#toggle_members").show();
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

            //console.log(doc.data().name);
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
    //console.log("You are already a part of this server!");
    showUnsucessfullJoin(serverName);
  }else{
    var now = new Date();

    db.collection("groups/"+ serverID + "/requests").doc(user_id).set({
        requestee: username,
        requestee_id: user_id,
        message: join_message,
        timestamp: now
    }).then(function() {
        //console.log("Server join request sent!");
        hideServerJoin();
        showSucessfullJoin(serverName);
    });
  }
}

function showSucessfullJoin(serverName) {
  $("#success_join").css('opacity', '0');
  $("#success_join_title").html("Sucessfully sent request to server  <strong>" + serverName +"</strong>");
  $("#success_join").show();

  setTimeout(function(){
    $("#success_join").css('opacity', '1');
    
  }, 100);

  setTimeout(hideSucessfullJoin, 5000);
}

function showUnsucessfullJoin(serverName) {
  //$("#success_join").css('opacity', '0');
  $("#success_join_title").html("You are already appart of  <strong>" + serverName +"</strong>");
  $("#success_join").show();
  $("#success_join").removeClass("slide-out-top");

  setTimeout(function(){
    //$("#success_join").css('opacity', '1');
    $("#success_join").addClass("slide-in-top");
    
  }, 100);

  setTimeout(hideSucessfullJoin, 5000);
}

function hideSucessfullJoin(){
  //$("#success_join").css('opacity', '0');
  $("#success_join").removeClass("slide-in-top");
  $("#success_join").addClass("slide-out-top");

  setTimeout(function(){
    $("#success_join").hide();
  }, 2000);
}

function createServer(serverName){
    
    let autoID = db.collection("groups").doc().id;
    var description = $("#create_server_description").val();

    db.collection("groups").doc(autoID).set({
      name: serverName,
      desc: description,
      icon: "defaultServerIcon.png"
    }).then(function() {
        //console.log("Server " + serverName + " is beging created");
    });

    var now = new Date();

    var new_auto_id = db.collection("groups/"+ autoID +"/channels/").doc().id;

    db.collection("groups/"+ autoID +"/channels").doc(new_auto_id).set({
      deafult: true,
      desc: "A New Channel",
      name: "New Channel",
      type: "text"
    }).then(function() {
      db.collection("groups/"+ autoID +"/channels/" + new_auto_id + "/messages").doc("1").set({
          sender: "Server",
          senderId: "1",
          message: "Welcome to <strong>" + serverName + "</strong>.",
          timestamp: now
      }).then(function() {
          var user_servers = db.collection("users").doc(user_id);
          return user_servers.update({
            servers: firebase.firestore.FieldValue.arrayUnion(autoID)
          })
      });
    });

    db.collection("groups/"+ autoID +"/members").doc(user_id).set({
      userId: user_id,
      username: username
    }).then(function() {
    });

    db.collection("groups/"+ autoID +"/roles").doc("owner").set({
      colour: "gold",
      colour_rgb: "#ffd700",
      perm_lvl: 10,
      name: "owner",
      admin: true,
      audit: true,
      manage_server: true,
      manage_roles: true,
      manage_channels: true,
      pingable: true,
      deletable: false,
      deafult: false,
    })
    
    db.collection("groups/"+ autoID +"/roles").doc("all").set({
      colour: "ping",
      colour_rgb: "#909090",
      perm_lvl: 0,
      name: "all",
      admin: false,
      audit: false,
      manage_server: false,
      manage_roles: false,
      manage_channels: false,
      pingable: false,
      deafult: true,
      deletable: false,
    }).then(function() {
      //console.log("Server's Roles Setup!");

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
      complete_date.pop();
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

var channel;
var channel_info;

function joinServer(room_id_element){
    removeDuplicates();
    $("#deafult_ui_loading_category_").show();
    $("#members_2").hide();

    var appart = false;

    db.collection("groups/"+ room_id_element +"/members").get()
    .then(querySnapshot => {
        querySnapshot.forEach(doc => {
            serverMembers.push(doc.data().username);
            if(doc.data().username == username){
              appart = true;
            }
        });

        if(!appart){
          return;
        }
    
    while(role_names.length > 1){
      role_names.pop();
    }

    $("#channel_con").text("");
    $("#channel_con_des").text("");

    db.collection("groups/" + room_id_element + "/channels")
    .orderBy("deafult", "asc").get() 
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        //console.log(doc.data());

        channel = doc.id;
        channel_info = doc.data();

        $("#channel_con").text(channel_info.name);
        $("#channel_con_des").text(channel_info.desc);
        //console.log(channel_info.name, channel_info.desc);
      })  
      
        if(rmid){
          db.collection("groups/"+ rmid +"/roles").get()
          .then(querySnapshot => {
              querySnapshot.forEach(doc => {
                  var dep_role = {name: doc.id, color: doc.data().colour, rgb: doc.data().colour_rgb, perm_level: doc.data().perm_lvl, admin: doc.data().admin, audit: doc.data().audit, manage_server: doc.data().manage_server, manage_roles: doc.data().manage_roles, manage_channels: doc.data().manage_channels, pingable: doc.data().pingable, deletable: doc.data().deletable, deafult: doc.data().deafult };
                  roles.push(dep_role);
                  role_names.push(doc.id)

                  var index___  = servers.findIndex(element => element.sid == rmid);
                  servers[index___].roles.push(dep_role);
              });
  
              roles.sort((a, b) => (a.perm_level > b.perm_level) ? -1 : 1)
  
              renderMembersList();
          });      
        }
      
      if(loadable) joinChannel(channel);
     
      renderChannels(channel);
    });

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

    var sender = "";
    var msge = "";
    var time = "";
    var senderIdentification = "";

    

    if(room_id_element){
        $("#" + room_id_element).find("span").removeClass("pill_hidden");
        $("#" + room_id_element).find("div span").addClass("pill");
        $("#" + room_id_element).find("img").addClass("list_item_active");
    }

    var image_src = $("#" + room_id_element).find("img").attr('src');
    //document.getElementById("header").style.backgroundImage = "linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0)), url('" + image_src + "')";
  });
}

function renderChannels(channel) {
  while(document.getElementById("channels").firstChild){
    document.getElementById("channels").removeChild(document.getElementById("channels").firstChild);
  }

  db.collection("groups/" + rmid + "/channels")
  .orderBy("deafult", "desc").get() 
  .then(querySnapshot => {
    $(".active").removeClass("active");

    querySnapshot.forEach((doc) => {
      //console.log(doc.data());

      var new_channel = document.createElement("div");
          new_channel.classList.add("server_channel");
          new_channel.setAttribute("draggable", "true");
          new_channel.id = `channel_${doc.id}`;
      
          if(doc.id == channel) new_channel.classList.add("active");

      var new_channel_hashtag = document.createElement("i");
          new_channel_hashtag.classList.add("fa");
          new_channel_hashtag.classList.add("fa-hashtag");
          new_channel.appendChild(new_channel_hashtag);

      var new_channel_text = document.createElement("p");
          new_channel_text.innerHTML  = doc.data().name;
          new_channel.appendChild(new_channel_text);

      var new_channel_settings = document.createElement("i");
          new_channel_settings.classList.add("fa");
          new_channel_settings.classList.add("fa-gear");
          new_channel_settings.classList.add("channel_setting");
          new_channel_settings.setAttribute("tooltip-content", "Ebic")
          new_channel.appendChild(new_channel_settings);

      
      var channel_info_ = {cid: doc.id, info: doc.data()};

      var index___  = servers.findIndex(element => element.sid == rmid);
      servers[index___].channels.push(channel_info_);
          
      document.getElementById("channels").appendChild(new_channel);
    });
  });
}

function joinChannel(channel_id){ 
  loadable = false;
  while(document.getElementById("message-container").firstChild){
    document.getElementById("message-container").removeChild( document.getElementById("message-container").firstChild);
  }

  $(function() {
    $("#channels").sortable({
        connectWith: "#channels",
        items: "div.server_channel",

        change: function(event, ui) {
          ui.placeholder.css({visibility: 'visible', border : '1px solid var(--online)', backgroundColor : 'var(--online)'});
        }
    }).disableSelection();
});

  while(messages.length > 0) {
    messages.pop();
    authors.pop();
    dates.pop();
    userId_message.pop();
    serverMembers.pop();
    complete_date.pop();
  }

  $("#channel_con").text("");
  $("#channel_con_des").text("");

  db.collection("groups/" + rmid + "/channels").doc(channel_id).get() 
    .then(querySnapshot => {
      //console.log(querySnapshot._document.proto.fields);

      channel = querySnapshot.id;
      channel_info = {deafult: querySnapshot._document.proto.fields.deafult.booleanValue, desc: querySnapshot._document.proto.fields.desc.stringValue, name: querySnapshot._document.proto.fields.name.stringValue, type: querySnapshot._document.proto.fields.type.stringValue};
      document.title = `#${channel_info.name.toLowerCase()}`; // Change # for type

      $("#channel_con").text(channel_info.name);
      $("#channel_con_des").text(channel_info.desc);
    });

  if(rmid){
    db.collection("groups/"+ rmid + "/channels/" + channel_id + "/messages").orderBy("timestamp", "desc").limit(100).get()
    .then(querySnapshot => {
        querySnapshot.forEach(doc => {
            sender = doc.data().sender;
            authors.push(doc.data().sender);
            senderIdentification = doc.data().senderId;
            userId_message.push(doc.data().senderId);
            msge = doc.data().message;
            messages.push(doc.data().message);
            time = formatDate(doc.data().timestamp.toDate());
            dates.push(formatDate(doc.data().timestamp.toDate()));
            complete_date.push(doc.data().timestamp.toDate());
            var someElementsItems = document.querySelectorAll(".user_refrence");
        });

        authors.reverse();
        userId_message.reverse();
        messages.reverse();
        dates.reverse();
        
        updateMessages("null");
        updateTyping();
        loadable = true;
    });
  }

  $("#serverMoreInfo").show();
}

$("#server_channel_create").on("click", () => {
  createChannel();
});

function createChannel(){
  if(doesUserHavePerms('manage_channels')){
    var now = new Date();
    var new_auto_id = db.collection("groups/"+ rmid +"/channels/").doc().id;
    
    db.collection("groups/"+ rmid +"/channels").doc(new_auto_id).set({
      deafult: true,
      desc: "A New Channel",
      name: "new-channel",
      type: "text"
    }).then(function() {
      db.collection("groups/"+ rmid +"/channels/" + new_auto_id + "/messages").doc("1").set({
          sender: "Server",
          senderId: "1",
          message: "Welcome to <strong> new-channel </strong>.",
          timestamp: now
      });

      showNotitfication("", "Channel Created");
    });
    
  }else{
    showNotitfication("", "An Error Occured");
  }
}

function closeListener() {
  unsubscribe(); 
}

$("#channels").on("click", "div", function() {
  if(!$(this).hasClass("active")){
    var clicked_ = $(this)[0].id.replace("channel_", "");
    $(".active").removeClass("active");
    $(this).addClass("active");
    
    if(loadable) joinChannel(clicked_);
  }
}); //eeeeeeee

$("#channels").on("click", ".channel_setting", function() {
  showChannelSettings();
});

function renderMessages(){
    while(document.getElementById("message-container").firstChild){
      document.getElementById("message-container").removeChild( document.getElementById("message-container").firstChild);
    }

    var someElementsItems = document.querySelectorAll(".user_refrence");
    var samecount = 0;

    for(var i = 0; i < messages.length; i++){
      var highlight_color = "deafult";
      var message = document.createElement("div");

      var divider = document.createElement("div");
          divider.classList.add("message");

      var divider2 = document.createElement("div");
          divider2.classList.add("message_left");

      var m = server_members.findIndex(element => element.name == authors[i]);
      //console.log(server_members[m]);
      /*
      var location = server_members[i].info.findIndex(element => element.server == room);
      console.log(server_members[m].info[location]);

      if(location >= 0){
        var high = 0;
        var high_role;
        var itterator = 0;

        //console.log(server_members[i].info[location].roles);
        console.log(server_members[m]);
        server_members[m].info[location].roles.forEach((element, m) =>{
          //console.log(element);

          if(element.perm_level >= high){
            high = element.perm_level;
            high_role = element;
            itterator = m;
          }
        });
      }
      */

      if(messages[i].includes("@")){
        var str = messages[i];

        var n = str.search("@");
        var res = str.split("@", 2);
        var result = res[1].split(" ", 2);
        var k = str.search(" ");

        p = roles.findIndex(i => i.name === result[0]);
        
        var users_photo = server_members.findIndex(i => i.uid == userId_message[i])
        //console.log(userId_message[i], users_photo);

        var role_called = res[1].split(" ");
        //console.log(role_called[0]);

        var end_result;
        var role_color;
        var pingable = false;
        //console.log(end_result);

        if(p != -1 && roles[p].pingable){
          highlight_color = roles[p].color;
          role_color = roles[p].rgb;
          end_result = messages[i].replace(`@${role_called[0]}`, `<div class="role_call"><p style="color: ${role_color}; padding-left: 2px; padding-right: 2px">@${role_called[0]}</p></div>`);
        }else{
          highlight_color = "deafult";
        }
        
      }else{
        highlight_color = "deafult";
      }

      if($("#message-container").children().length > 0){
        if(highlight_color !== "deafult"){
          if(authors[i - 1] === authors[i] && samecount < 10){
                divider.classList.add("special_message");
                var message2 = document.createElement("p");
                    message2.innerHTML = end_result;
/*                
                  message.style.backgroundColor = hexToRgbA(role_color, 0.2);
                  message.style.borderLeftColor = role_color;
                  message.style.borderLeftStyle = "solid";
                  message.style.borderLeftWidth = "2px";
                  message.style.width = "calc(100% - 2px)";
*/                
                 
                divider.append(message2);
                samecount++;
            }else{
                //$("#message-container").append($('<br>'));
                //$("#message-container").append($('<hr>'));
                $("#message-container").append($('<br>'));
                
                var image = document.createElement("img");
                    image.setAttribute("src", server_members[m].icon);
                    
                divider2.append(image); 

                var author = document.createElement("h2");
                    author.classList.add("user_refrence");
                    author.innerHTML = authors[i];
                
                var date = document.createElement("h3");
                    date.innerHTML = dates[i];
                
                    divider.classList.add("special_message");
                    var message2 = document.createElement("p");
                        message2.innerHTML = end_result;
/*                    
                      message.style.backgroundColor = hexToRgbA(role_color, 0.2);
                      message.style.borderLeftColor = role_color;
                      message.style.borderLeftStyle = "solid";
                      message.style.borderLeftWidth = "2px";
                      message.style.width = "calc(100% - 2px)";
*/                    
                     
                    divider.append(message2);
                    samecount++;
                
                divider.append(author);
                divider.append(date);
                divider.append(message2);
                
/*
                if(highlight_color == "ping"){
                  message.classList.add("mentioned"); 
                }else if(highlight_color == "light_blue"){
                  message.classList.add("highlighted");
                }else if(highlight_color == "gold"){
                  message.classList.add("owner");
                }
*/
                samecount = 0;
            }
        }else{
          if(authors[i - 1] === authors[i] && samecount < 10){
                var message2 = document.createElement("p");
                    message2.innerHTML = messages[i];
                    divider.style.paddingLeft = "33px";
                  
                divider.append(message2);
                samecount++;
            }else{
                //$("#message-container").append($('<br>'));
                //$("#message-container").append($('<hr>'));
                $("#message-container").append($('<br>'));
                //$("#message-container").append($('<img src="public/'+ user +'.jpg">'));
                var image = document.createElement("img");
                    image.setAttribute("src", server_members[m].icon);

                divider2.append(image); 
                
                var author = document.createElement("h2");
                    author.classList.add("user_refrence");
                    author.innerHTML = authors[i];
                    //author.style.color = server_members[m].info[location].roles[itterator].rgb;
                
                var date = document.createElement("h3");
                    date.innerHTML = dates[i];
                
                var message2 = document.createElement("p");
                    message2.innerHTML = messages[i];

                    //console.log(messages[i]);
                
                divider.append(author);
                divider.append(date);
                divider.append(message2);
                samecount = 0;
                
            }
        }
            
      }else{
              $("#message-container").append($('<br>'));

              if(server_members[m]){
                var image = document.createElement("img");
                  image.setAttribute("src", server_members[m].icon);
                    
                divider2.append(image); 
              }else{
                var image = document.createElement("img");
                    image.setAttribute("src", "./branding/deafultUserIcon.jpg");
                    
                divider2.append(image); 
              }
              
              var author = document.createElement("h2");
                  author.classList.add("user_refrence");
                  author.innerHTML = authors[i];
              
              var date = document.createElement("h3");
                  date.innerHTML = dates[i];
              
              var message2 = document.createElement("p");
                  message2.innerHTML = messages[i];
              
              divider.append(author);
              divider.append(date);
              divider.append(message2);
              samecount = 0;
      }
      
          message.append(divider2);
          message.append(divider);

      $("#message-container").append(message);
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


$("#message-input").on('focus', function () {
  if(room !== "lobby_link"){
    db.collection("groups/"+ rmid +"/typing").doc(user_id).set({
      userId: user_id,
      name: username
    }).then(function() {  
        //console.log("Typing created");
    });
  }
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

function testerFunction() {
  db.collection("groups/")
    .onSnapshot(function(querySnapshot) {
      //console.log("new one down the pipe!");
      querySnapshot.forEach(function(doc) {
          console.log(doc);
      });
    });
}

var unsubscribe;

function updateMessages(usersid){
  if(room !== "lobby_link"){
    if(unsubscribe){
      unsubscribe();   // FUCKING UNSUBSCRIBE GODDAMIT
    } 

    unsubscribe = db.collection("groups/" + rmid + "/channels/" + channel + "/messages").orderBy("timestamp", "desc").limit(1)
    .onSnapshot(function(querySnapshot) {
      //console.log("new one down the pipe!");
      querySnapshot.forEach(function(doc) {
          if(doc.data().timestamp.toDate().toString() == complete_date[0].toString()){ 
            
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
            complete_date.push(doc.data().timestamp.toDate());
            console.log(msge);
          }
      });

      renderMessages();
    });
  }else {
    unsubscribe = db.collection("users/" + user_id + "/direct_messages/" + usersid + "/messages").orderBy("timestamp", "desc").limit(1)
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
  //console.log("Switching theme");
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

function darkTheme() {
  document.documentElement.setAttribute('theme', 'dark');
}

const toggleMembers = document.querySelector("#toggle_members");

toggleMembers.addEventListener('click', e => {
  $("#members").toggle();
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
  if(!serverMenu_hid){
    if(!$(event.target).is('#serverMenu')){
      hideServerMenu();
    }
  }else if($(event.target).is("#header") && room !== "lobby_link" || $(event.target).parents('#header').length > 0 && room !== "lobby_link"){
    toggleServerMenu();
  }else{
    //console.log($(event.target));
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
  $(".settings_pannel").hide();
  loadAccountSettings();
}

function loadAccountSettings() {
  $(".settings_pannel").hide();
  $("#account").show();

  var index = server_members.findIndex(element => element.uid == user_id);
  //console.log(server_members[index]);

  $("#settings_username").text(username);
  $("#settings_email").text(user_email);
  $("#settings_icon").attr("src", server_members[index].icon);
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

$("#server_settings_button").click(function() {
  showServerSettings();
});

$("#close_server_settings").click(function(){
  hideServerSettings();
});

$("#member_manage_par").click(function(event){
  if($(event.target).is("#member_manage_par")){
    hideMembers();
  }
});

$("#server_settings").click(function(event){
  if($(event.target).is("#server_settings")){
    hideServerSettings();
  }
});

$("#channel_settings").click(function(event){
  if($(event.target).is("#channel_settings")){
    hideChannelSettings();
  }
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

      var server_member_manage_top = document.createElement("div");
      var server_member_manage_title = document.createElement("h4");
          server_member_manage_title.innerHTML = "REQUESTS - " + have;

          server_member_manage_top.append(server_member_manage_title);

      document.getElementById("member_requests").appendChild(server_member_manage_top);

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

      if(have == 0){
        var failed_div = document.createElement("div");
            failed_div.id = "failed_div";

        var fail_to_create = document.createElement("h4");
            fail_to_create.innerHTML = "NO REQUESTS...";
            failed_div.appendChild(fail_to_create);
        
        var fail_to_create2 = document.createElement("h6");
            fail_to_create2.innerHTML = "Its lonely out here...";
            failed_div.appendChild(fail_to_create2);
        
        var fail_to_create_image = document.createElement("img");
            fail_to_create_image.src = "";
            failed_div.appendChild(fail_to_create_image);
        
        document.getElementById("member_requests").append(failed_div);
      }
  });
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
    //console.log("Document successfully deleted!");
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

function createRole() {
  showNotitfication("","Creating Role...");

  var new_roles_num = 0;

  roles.forEach((element) => {
    if(element.name === "New Role"){
      new_roles_num++;
    }else if(element.name == `New Role (${new_roles_num})`){
      new_roles_num++;
    }
  });
  //let autoID = db.collection("groups/"+ rmid +"/messages").doc().id;

  db.collection("groups/"+ rmid +"/roles").doc(`New Role (${new_roles_num})`).set({
    colour: `custom`,
    colour_rgb: "#f4f4f4",
    perm_lvl: 0,
    name: `New Role (${new_roles_num})`,
    admin: false,
    audit: false,
    manage_server: false,
    manage_roles: false,
    manage_channels: false,
    pingable: true,
    deletable: true,
    deafult: false,
  }).then(() => {
    while(roles.length > 0){
      roles.pop();
    }

    db.collection("groups/"+ rmid +"/roles").get()
    .then(querySnapshot => {
        querySnapshot.forEach(doc => {
            var dep_role = {name: doc.id, color: doc.data().colour, rgb: doc.data().colour_rgb, perm_level: doc.data().perm_lvl, admin: doc.data().admin, audit: doc.data().audit, manage_server: doc.data().manage_server, manage_roles: doc.data().manage_roles, manage_channels: doc.data().manage_channels, pingable: doc.data().pingable, deletable: doc.data().deletable, deafult: doc.data().deafult };
            roles.push(dep_role); 

            var index___  = servers.findIndex(element => element.sid == rmid);
            servers[index___].roles.push(dep_role);
            role_names.push(doc.id)
        });

        roles.sort((a, b) => (a.perm_level > b.perm_level) ? -1 : 1)

        showNotitfication("","Created");
        renderInvite();
    });
  });
}

function renderInvite(){
  $("#member_requests").hide();
  $("#member_managment").hide();
  $("#member_invite").show();

  $("#show_requests").removeClass("active_member_manage");
  $("#show_managment").removeClass("active_member_manage");
  $("#show_invite").addClass("active_member_manage");

  while(document.getElementById("member_invite").firstChild){
    document.getElementById("member_invite").removeChild(document.getElementById("member_invite").firstChild);
  }
  var parent_div__ = document.createElement("div");
      parent_div__.classList.add("role_parent");
      parent_div__.id = "role_sett_div";

  var left_pannel = document.createElement("div");
      var left_pannel_title_area = document.createElement("div");
          left_pannel_title_area.classList.add("roles_title_area");

      var title_ = document.createElement("h4");
          title_.innerHTML = "ROLES";
      
      var add_button = document.createElement("i");
          add_button.classList.add("fa");
          add_button.classList.add("fa-plus");
          add_button.setAttribute("onclick", "createRole()");

      left_pannel_title_area.appendChild(title_);
      left_pannel_title_area.appendChild(add_button);
      left_pannel.appendChild(left_pannel_title_area);
      left_pannel.classList.add("roles_left_pannel");
      roles.sort((a, b) => (a.perm_level > b.perm_level) ? -1 : 1) 
      parent_div__.appendChild(left_pannel);

  var deafult_role;
  document.getElementById("member_invite").appendChild(parent_div__);

  roles.forEach((element, index) => {
    if(element.deafult){
      deafult_role = element;
      openSettingsRoles(index, 1);
    }

    var role__ = document.createElement("div");
        role__.classList.add("role_div");
        role__.id = "role_" + index;
        role__.setAttribute("onclick", `openSettingsRoles(${index}, 0)`);

    var role_text = document.createElement("p");
        role_text.innerHTML = element.name;
        role__.style.color = element.rgb;
        role__.append(role_text);


        left_pannel.appendChild(role__);
  });  
}

var temp_edit_role;
var temp_comp_role;

function openSettingsRoles(index, k){
  
  //console.log(k);
  if(document.getElementById("roles_right_pannel_parent")){
    document.getElementById("role_sett_div").removeChild(document.getElementById("roles_right_pannel_parent"));
  }
  
  $(".role_div").removeClass("active");
  $("#role_" + index).addClass("active");

  $(".role_div").css("background-color", "inherit");

  var slides = document.getElementsByClassName("role_div");
  for (var i = 0; i < slides.length; i++) {
    $("#role_" + i).css("color", roles[i].rgb);
  }

  $("#role_" + index).css("background-color", roles[index].rgb);
  $("#role_" + index).css("color", "white");

  //console.log(roles[index]);
  var deafult_role = roles[index];
  temp_edit_role = 
  {
    name: roles[index].name, 
    color: roles[index].color, 
    rgb: roles[index].rgb,
    perm_level: roles[index].perm_level,
    admin: roles[index].admin, 
    audit: roles[index].audit, 
    manage_server: roles[index].manage_server,
    manage_roles: roles[index].manage_roles,
    manage_channels: roles[index].manage_channels,
    pingable: roles[index].pingable,
    deletable: roles[index].deletable, 
    deafult: roles[index].deafult, 
  };

  if(temp_comp_role === null || temp_comp_role === undefined){
    temp_comp_role = temp_edit_role;
  }else if(temp_edit_role.name !== temp_comp_role.name){
    temp_comp_role = temp_edit_role;
  }
  // Unlink Objects ?!!?!?!

  var right_pannel_parent = document.createElement("div");
      right_pannel_parent.id = "roles_right_pannel_parent";

  var unsaved_changes = document.createElement("div");
      unsaved_changes.classList.add("unsaved_changes");
      unsaved_changes.id = "roles_unsaved_changes";
      unsaved_changes.classList.add("hidden");

  var unsaved_changes_text = document.createElement("h1");
      unsaved_changes_text.innerHTML = "You have unsaved changes";
      unsaved_changes.append(unsaved_changes_text);

  var button_div = document.createElement("div");
      button_div.classList.add("button_role_reset_changes");

  var reset_changes_button = document.createElement("button");
      reset_changes_button.innerHTML = "Reset";
      reset_changes_button.setAttribute("onclick", `openSettingsRoles(${index}, ${k})`);
      button_div.append(reset_changes_button);
      unsaved_changes.append(button_div);

  var unsaved_changes_button = document.createElement("button");
      unsaved_changes_button.innerHTML = "Apply";
      unsaved_changes_button.setAttribute("onclick", `saveRoleChanges(${index}, ${k})`);
      button_div.append(unsaved_changes_button);
  
  var right_pannel = document.createElement("div");
      right_pannel.classList.add("roles_right_pannel");
      right_pannel.id = "roles_right_pannel";
      
      // Role Name
      var role_top_partition = document.createElement("div");
          role_top_partition.classList.add("role_right_pannel_top");

      var right_pannel_first_section = document.createElement("div");
      var right_title_1 = document.createElement("h4");
          right_title_1.innerHTML = "ROLE NAME";

      var name_div = document.createElement("input");
          name_div.classList.add("role_name_settings");
          name_div.value = deafult_role.name; 
          name_div.style.color = deafult_role.rgb; 
          name_div.id = `${index}_name_${deafult_role.name}`;

      // Role Colour
      var right_pannel_seccond_section = document.createElement("div");
      var right_title_2 = document.createElement("h4");
          right_title_2.innerHTML = "ROLE COLOUR";

      var color_selector_div = document.createElement("div");
      
      var color_selector = document.createElement("input");
          color_selector.setAttribute("type", "color");
          color_selector.setAttribute("value", deafult_role.rgb);
          color_selector.classList.add("colour_picker");
          color_selector.id = `${index}_colour_${deafult_role.name}`;

      var color_selector_text = document.createElement("input");
          color_selector_text.classList.add("role_name_settings");
          color_selector_text.value = deafult_role.name; 
          color_selector_text.style.color = deafult_role.rgb; 
      
      // Permissions
      var button__ = document.createElement("label");
          button__.classList.add("switch");
          var button_input = document.createElement("input");
              button_input.setAttribute("type", "checkbox");
          
          var button_span = document.createElement("span");
              button_span.classList.add("slider");
              button_span.classList.add("round");

          button__.append(button_input);
          button__.append(button_span);

      var right_pannel_third_section = document.createElement("div");
      var right_title_3 = document.createElement("h4");
          right_title_3.innerHTML = "ROLE PERMISSIONS";
      
      var ping_section = createDocument(
        "Allow this role to be @mentioned", 
        "Enabling this allows <strong>anyone</strong> to mention this role", 
        `pingable", "${deafult_role.name}`,
        deafult_role.pingable,
        index);

      var admin_section = createDocument(
        "Give this role administrator permissions", 
        "Enabling this allows <strong>the user</strong> access any of the below features and shoud only be given to trustworthy individuals", 
        `admin", "${deafult_role.name}`,
        deafult_role.admin,
        index);

      var audit_section = createDocument(
        "Give this role the ability to read the audit log", 
        "", 
        `audit", "${deafult_role.name}`,
        deafult_role.audit,
        index);

      var manage_server_section = createDocument(
        "Give this role and its users the ability to manage the server", 
        "", 
        `manage_server", "${deafult_role.name}`,
        deafult_role.manage_server,
        index);

      var manage_channel_section = createDocument(
        "Give this role and its users the ability to manage channels, thier names and thier settings", 
        "", 
        `manage_channels", "${deafult_role.name}`,
        deafult_role.manage_channels,
        index);

      var manage_roles_section = createDocument(
        "Give this role and its users the ability to manage roles, their names and their settings", 
        "", 
        `manage_roles", "${deafult_role.name}`,
        deafult_role.manage_roles,
        index);

      var delete_role_button = document.createElement("button");
          delete_role_button.innerHTML = "Delete Role";
          delete_role_button.setAttribute("onclick", `deleteRole(${index}, ${k})`);
          delete_role_button.classList.add("delete_role_button");
        
      right_pannel_first_section.append(right_title_1);
      right_pannel_first_section.append(name_div);

      right_pannel_seccond_section.append(right_title_2);
      right_pannel_seccond_section.append(color_selector);

      role_top_partition.appendChild(right_pannel_first_section);
      role_top_partition.appendChild(right_pannel_seccond_section);

      right_pannel_third_section.append(right_title_3);
      right_pannel_third_section.append(ping_section);
      right_pannel_third_section.append(admin_section);
      right_pannel_third_section.append(audit_section);

      right_pannel_third_section.append(manage_server_section);
      right_pannel_third_section.append(manage_channel_section);
      right_pannel_third_section.append(manage_roles_section);

      right_pannel.appendChild(role_top_partition);
      right_pannel.appendChild(right_pannel_third_section);
      right_pannel.append(delete_role_button);

      right_pannel_parent.append(right_pannel);
      right_pannel_parent.append(unsaved_changes);

    document.getElementById("role_sett_div").appendChild(right_pannel_parent);
}

function createDocument(a,b,c,d, e){
  //console.log(c, d);
  var button__ = document.createElement("label");
          button__.classList.add("switch");
          var button_input = document.createElement("input");
              button_input.setAttribute("type", "checkbox");

              if(d){
                button_input.setAttribute("checked", "checked");
              }
              
          var button_span = document.createElement("span");
              button_span.classList.add("slider");
              button_span.classList.add("round");

          button__.append(button_input);
          button__.append(button_span);

  var administrator_access = document.createElement("div");
          administrator_access.classList.add("role_setting_");

          var administrator_text = document.createElement("div");
          
          var administrator_header = document.createElement("h1");
              administrator_header.innerHTML = a;

          var administrator_paragraph = document.createElement("p");
              administrator_paragraph.innerHTML = b;

          var admin_button = document.createElement("div");
              admin_button.style.alignSelf = "center";
              admin_button.setAttribute("onmouseup", `changeRole("${c}", "${e}")`);
              admin_button.append(button__.cloneNode(true));

          administrator_text.append(administrator_header);
          administrator_text.append(administrator_paragraph);

          administrator_access.append(administrator_text);
          administrator_access.append(admin_button);

  return administrator_access;
}

$(document).on('change', 'input[type="color"]', function() {
  //console.log($(this).val());
  $(".role_name_settings").css("color", $(this).val());
  var info__ = $(this)[0].id.split("_colour_");
  var index = info__[0];
  var role_name = info__[1];
  temp_edit_role["rgb"] = $(this).val();

  changeRole("rgb", role_name, index);
});

$(document).on('input', '.role_name_settings', function() {
  //console.log($(this).val());

  var info__ = $(this)[0].id.split("_colour_");

  var index = info__[0];
  var role_name = info__[1];

  temp_edit_role["name"] = $(this).val();

  changeRole("name", role_name, index);
});

function changeRole(type, role_name, index) {
  //$('.role_setting_ input:checkbox:checked').length;
  //console.log(`Changing ${role_name}'s [${type}] from ${temp_edit_role[type]} ref(${temp_comp_role[type]}) to ${!temp_edit_role[type]}`);
  if(type !== "rgb" && type !== "name"){
    temp_edit_role[type] = !temp_edit_role[type];
  }
  
  //console.log(index);
  //console.log(`? ${temp_edit_role[type]} : ${roles[index][type]}`);

  if(JSON.stringify(temp_edit_role) !== JSON.stringify(roles[index])){
    $("#roles_unsaved_changes").removeClass("hidden");
    $("#roles_right_pannel").addClass("roles_right_pannel_unsaved");
  }else{
    $("#roles_unsaved_changes").addClass("hidden");
    $("#roles_right_pannel").removeClass("roles_right_pannel_unsaved");
  }
}

function doesUserHavePerms(perm){
  var this_user = server_members.findIndex(element => element.uid == user_id);
  var users_index = server_members[this_user].info.findIndex(element => element.server == rmid);
  var failure = false;

  server_members[this_user].info[users_index].roles.forEach((element) => {
    //console.log(element);
    //console.log(element[perm]);

    var k = (element[perm]) ? true : false;
    //console.log(k);

    if(k == true) failure = true;
  });

  return failure;
}

function saveRoleChanges(index, k){
  showNotitfication("", "Applying Changes");
  console.log(roles[index]);
  console.log(k);
  console.log(roles[index][k]);

  db.collection("groups/"+ rmid +"/roles").doc(temp_comp_role.name).delete().then(() => {
    db.collection("groups/"+ rmid +"/roles").doc(temp_edit_role.name).set({
      admin: temp_edit_role.admin,
      audit: temp_edit_role.audit,
      colour: temp_edit_role.color,
      colour_rgb: temp_edit_role.rgb,
      deafult: temp_edit_role.deafult,
      deletable: temp_edit_role.deletable,
      manage_channels: temp_edit_role.manage_channels,
      manage_roles: temp_edit_role.manage_channels,
      manage_server: temp_edit_role.manage_server,
      name: temp_edit_role.name,
      perm_lvl: temp_edit_role.perm_level,
      pingable: temp_edit_role.pingable
    }).then(() => {
      showNotitfication("", "Changes Applied");
    });
  })
}

$('#member_invite').on('mouseover', '.role_div', function() {
  if(!$(this).hasClass("active")){
    var color = this.id;
    color = color.replace("role_", "");
    this.style.backgroundColor = hexToRgbA(roles[color].rgb, "0.1");
  }
});

$('#member_invite').on("mouseleave", ".role_div", function() {
  if(!$(this).hasClass("active")){
    this.style.backgroundColor = "inherit";
  }
});

function hexToRgbA(hex, opacity){
  var c;
  if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c= hex.substring(1).split('');
      if(c.length== 3){
          c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c= '0x'+c.join('');
      return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+ opacity + ')';
  }
  throw new Error('Bad Hex');
}

function showMembers() {
  $("#member_manage_par").show();
  renderInvite();

  $("#member_requests").hide();
  $("#member_managment").hide();
  $("#member_invite").show();

  $("#member_manage_par").addClass("fade-in");
  $("#member_manage_par").removeClass("fade-out");

  $("#member_manage_par #member_manage").removeClass("scale-out-center");
  $("#member_manage_par #member_manage").addClass("scale-up-center");
}

function hideMembers() {
  $("#member_manage_par #member_manage").removeClass("scale-up-center");
  $("#member_manage_par #member_manage").addClass("scale-out-center");

  $("#member_manage_par").addClass("fade-out");
  $("#member_manage_par").removeClass("fade-in");

  setTimeout(function(){
    $("#member_manage_par #member_manage").removeClass("scale-out-center");
    $("#member_manage_par").hide();
  }, 350);
}

function showServerSettings() {
  $("#server_settings").show();
  renderOverview();

  $("#server_overview").show();

  $("#server_settings").addClass("fade-in");
  $("#server_settings").removeClass("fade-out");

  $("#server_settings #server_manage").removeClass("scale-out-center");
  $("#server_settings #server_manage").addClass("scale-up-center");
}

function hideServerSettings() {
  $("#server_settings #server_manage").removeClass("scale-up-center");
  $("#server_settings #server_manage").addClass("scale-out-center");

  $("#server_settings").addClass("fade-out");
  $("#server_settings").removeClass("fade-in");

  setTimeout(function(){
    $("#server_settings #server_manage").removeClass("scale-out-center");
    $("#server_settings").hide();
  }, 350);
}

function showChannelSettings() {
  $("#channel_settings").show();
  renderOverview();

  $("#channel_settings").show();

  $("#channel_settings").addClass("fade-in");
  $("#channel_settings").removeClass("fade-out");

  $("#channel_settings #server_manage").removeClass("scale-out-center");
  $("#channel_settings #server_manage").addClass("scale-up-center");
}

function hideChannelSettings() {
  $("#channel_settings #server_manage").removeClass("scale-up-center");
  $("#channel_settings #server_manage").addClass("scale-out-center");

  $("#channel_settings").addClass("fade-out");
  $("#channel_settings").removeClass("fade-in");

  setTimeout(function(){
    $("#channel_settings #server_manage").removeClass("scale-out-center");
    $("#channel_settings").hide();
  }, 350);
}

function renderOverview() {
  $("#server_overview").show();
  var this_server = servers.findIndex(element => element.sid == rmid);
  //console.log(servers[this_server]);

  $("#server_settings_name").attr("value", servers[this_server].info.name);
  $("#settings_overview_icon").attr("src", servers[this_server].icon);

  $(".active_member_manage").removeClass("active_member_manage");
  $("#show_overview").addClass("active_member_manage");
}

function renderMemberList() {
  while(document.getElementById("member_managment").firstChild){
    document.getElementById("member_managment").removeChild(document.getElementById("member_managment").firstChild);
  }

  var server_count = 0;

  var server_member_manage_top = document.createElement("div");
  var server_member_manage_title = document.createElement("h4");
      server_member_manage_title.id = "server_members_count";
          
  server_member_manage_top.append(server_member_manage_title);
  document.getElementById("member_managment").appendChild(server_member_manage_top);

  db.collection("groups/"+ rmid +"/members").get()
  .then(querySnapshot => {
    setTimeout(renderMessages, 500);
    querySnapshot.forEach(doc => {
      var parent_div_ = document.createElement("div");
          parent_div_.id = `roler_${doc.data().userId}`;
          parent_div_.classList.add("role_class_person");

      var role_div = document.createElement("div");

      var users_name_div = document.createElement("div");
          users_name_div.style.overflowX = "auto";
          users_name_div.style.width = "100%";

      var users_name = document.createElement("h1");
          users_name.innerHTML = doc.data().username;

      users_name_div.appendChild(users_name);
      parent_div_.appendChild(users_name_div);


      var index = server_members.findIndex(element => element.uid == doc.data().userId);
      var room_index = server_members[index].info.findIndex(x => x.server === room);

      server_members[index].info[room_index].roles.forEach((element) => {
        //console.log(element);
        
        var temp = document.createElement("div");
        var role_colour = element.rgb;
        
        //console.log(element, index);
        var temp_text = document.createElement("p");

            if(element.name.length > 3){
              temp_text.innerHTML =  element.name.substr(0,4).trim() + "...";
            }else{
              temp_text.innerHTML = element.name;
            }

            temp_text.style.margin = "0";
            temp_text.style.paddingLeft = "5px";
            temp_text.style.paddingRight = "5px";
            temp_text.style.color = role_colour;
            temp_text.style.whiteSpace = "no-wrap"; 
  
        temp.appendChild(temp_text);
        temp.style.borderColor = hexToRgbA(role_colour, "1");
        temp.style.borderWidth = "1px";
        temp.style.borderStyle = "solid";
        temp.style.backgroundColor = hexToRgbA(role_colour, "0.1");
        role_div.appendChild(temp);
        role_div.style.display = "flex";
        
      });

      var add_role_div = document.createElement("div");
          add_role_div.classList.add("add_role_div");

      var add_role = document.createElement("i");
          add_role.classList.add("fa");
          add_role.classList.add("fa-plus");
          add_role.setAttribute("onclick", `openAddRoleToUser("${doc.data().userId}")`);
          
      add_role_div.appendChild(add_role);
      role_div.appendChild(add_role_div);
      server_count++;

      parent_div_.appendChild(role_div);
      document.getElementById("member_managment").appendChild(parent_div_);
      $("#server_members_count").text("SERVER MEMBERS - " + server_count);
    });
    
  });
}

var role_selector_open = false;

function openAddRoleToUser(users_id_to_open){
  if(role_selector_open){
    $("#role_selector").remove();
  }
  
  role_selector_open = true;
  //var parent_div = document.getElementById(`roler_${users_id_to_open}`);
  var parent_div = $('*[id="roler_' + users_id_to_open + '"]');

  var role_div_ = document.createElement("div");
      role_div_.classList.add("add_roles_div");
      role_div_.id = "role_selector";

  var top_patition_ = document.createElement("div");
      top_patition_.classList.add("add_role_div_top");

  //var top_partition_tooltip = document.createElement("span");
  //    top_partition_tooltip.classList.add("tooltip");
  
  var top_patition_text = document.createElement("h3");
      top_patition_text.innerHTML = "<strong>ADD:</strong>";
  
  var top_patition_input = document.createElement("input");
      top_patition_input.setAttribute("placeholder", "Role");
      top_patition_input.setAttribute("type", "text");

  //top_patition_.appendChild(top_partition_tooltip);
  top_patition_.appendChild(top_patition_text);
  top_patition_.appendChild(top_patition_input);

  var role_div_list = document.createElement("div");
      role_div_list.id = "add_roles_div_list";

  var this_user = server_members.findIndex(element => element.uid == users_id_to_open);
  var users_index = server_members[this_user].info.findIndex(element => element.server == room);
  //var server_role_index = server_members[this_user].info

  roles.forEach((element) => {
    var can_add_role = false;
    server_members[this_user].info[users_index].roles.forEach((element_) => {
      if(element_.perm_level >= element.perm_level){
        can_add_role = true;
      }
    });

    if(can_add_role){
      if(server_members[this_user].info[users_index].roles.includes(element)){
        //console.log("it includes" + element.name);
      }else{
        var new_role = document.createElement("div");
            new_role.setAttribute("onclick", `addRoleToUser("${users_id_to_open}", "${element.name}")`);

        var new_role_text = document.createElement("h5");
            new_role_text.innerHTML = toUpper(element.name);
            new_role_text.style.color = element.rgb;
            

        new_role.appendChild(new_role_text);
        role_div_list.appendChild(new_role);
      }
    }
  });

  role_div_.appendChild(top_patition_);
  role_div_.appendChild(role_div_list);
  parent_div.append(role_div_);

  
}

$('body').on('click', function(event) {

  //console.log(event.target);

  if($(event.target).is("i.fa.fa-plus")){
    //console.log($(event.target.offsetParent).is("#role_selector"), "TARGET");
    //console.log(role_selector_open, "OPEN");
    
    if(!$(event.target.offsetParent).is("#role_selector") && !role_selector_open){
      $("#role_selector").remove();
    }
  }else {
    //console.log($(event.target.offsetParent).is("#role_selector"), "TARGET");
    //console.log(role_selector_open, "OPEN");

    if(!$(event.target.offsetParent).is("#role_selector")){
      $("#role_selector").remove();
    }
  }
});

function addRoleToUser(user_id__, role) {
  showNotitfication("", "Assigning Role");

  //... set document/{server_id}/members/{user_id}/roles = prev + role
  var users_servers = db.collection("groups/"+ rmid +"/members/").doc(user_id__);

  return users_servers.update({
    roles: firebase.firestore.FieldValue.arrayUnion(role)
  }).then(() => {
    showNotitfication("", "Assigned");
  });
}

$(document).on("mousedown", ".message_left img", function () {
  $(this).css("transform", "translateY(1px)");
})

$(document).on("mouseup", ".message_left img", function () {
  $(this).css("transform", "translateY(-1px)");
})

function findWithAttr(array, value) {
  for(var i = 0; i < array.length; i += 1) {
      //console.log(array[i].name, value);
      if(array[i].name === value) {
          return i;
      }
  }
  return -1;
}

function renderMembersList() {
  removeDuplicates();
  var parent = document.getElementById("members_2");

  while(parent.firstChild){
    parent.removeChild( parent.firstChild);
  }

  if(!loadingFriends){
    setTimeout(renderMembersList, 700);
    return;
  }

  db.collection("groups/"+ rmid +"/members").get()
  .then(querySnapshot => {
    querySnapshot.forEach(doc => {
        var users_roles = [];
        var user_role = doc.data().roles;

        for(var i = 0; i < user_role.length; i++){
          var p = role_names.indexOf(user_role[i]);
          //var k = roles.indexOf(user_role[i]);
          
          var k = findWithAttr(roles, user_role[i]);
          //console.log(user_role[i], k);
          users_roles.push(roles[k]);
        }

        users_roles.sort((a, b) => (a.perm_lvl > b.perm_lvl) ? 1 : -1)
        //console.log(users_roles);
        
        var temp_loc = server_members.findIndex(element => element.uid == doc.data().userId);
        var server_info = {server: room, roles: users_roles};

        if(temp_loc == -1){
          var docRef = db.collection("users").doc(doc.data().userId);
          var image_source = "";
          var ur2 = "";
          docRef.get().then(function(doca) {
              image_source = doca.data().icon;

              var storageRef = firebase.storage().ref("userIcons/").child(image_source).getDownloadURL().then(function(url) {
                ur2 = url;
                server_members.push({name: doc.data().username, info: [{server: room, roles: users_roles}], uid: doc.data().userId, icon: url});
                localStorage.setItem("1", JSON.stringify(server_members));
              });

              setTimeout(renderMemberList2, 500);
          });
        }else{
          if(server_members.filter(server_members => server_members.uid === doc.data().userId)){
            //console.log(temp_loc); 
            var server_loc = server_members[temp_loc].info.findIndex(element => element.server == room);
  
            if(server_loc < 0){
              server_members[temp_loc].info.push(server_info);
              setTimeout(renderMemberList2, 500);
              // Not Loading On Load of First Server Then it overloads!!!
            }else{
              //console.log("exists");
              setTimeout(renderMemberList2, 500);
            }
          }else{
            setTimeout(renderMemberList2, 500);
          }
        }
    });

  });
}

function renderMemberList2(){
  var parent = document.getElementById("members_2");
  
  while(parent.firstChild){
    parent.removeChild( parent.firstChild);
  }

  $("#deafult_ui_loading_category_").hide();
  $("#members_2").show();

  // Create All Categories First IN ORDER!!!
  for(var i = 0; i < roles.length; i++){
    var category__ = !!document.getElementById(roles[i].name.replace(/ /g,"_") + "_category");
    if(!category__){
      var new_category = document.createElement("div");
          new_category.id = roles[i].name.replace(/ /g,"_") + "_category";
      
      var text_child = document.createElement("p");
          text_child.innerHTML = roles[i].name;
          text_child.classList.add("user_category")
          new_category.appendChild(text_child);

      parent.append(new_category);
    }
  }
  

  for(var i = 0; i < server_members.length; i++){
    var location = server_members[i].info.findIndex(element => element.server == room);

    if(location >= 0){
      var high = 0;
      var high_role;
      var itterator = 0;

      //console.log(server_members[i].info[location].roles);
      server_members[i].info[location].roles.forEach((element, i) =>{
        //console.log(element);

        if(element.perm_level >= high){
          high = element.perm_level;
          high_role = element;
          itterator = i;
        }
      });

      var category__1 = document.getElementById(high_role.name.replace(/ /g,"_") + "_category");

      var member_user = document.createElement("div");
          member_user.classList.add("member_user");
          member_user.setAttribute("onclick", "userInfo('" + server_members[i].uid + "')");

      var member_icon = document.createElement("div");
          member_icon.classList.add("member_icon");

      var image = document.createElement("img");
          image.src = server_members[i].icon;
          image.classList.add("user_name_img");
      
      var status = document.createElement("div");
          status.classList.add("online");            /// CHANGE STATUS FROM STATUS PULL QUERY LATER 
      
      member_icon.append(image);
      member_icon.append(status);

      var user_info = document.createElement("div");
      
      var users_name_member = document.createElement("h1");
          users_name_member.innerHTML = server_members[i].name;
          //console.log(server_members[i]);
          users_name_member.style.color = server_members[i].info[location].roles[itterator].rgb;
      
      //var users_documented_status = document.createElement("h3");
      //    users_documented_status.innerHTML = "";

      user_info.append(users_name_member);
      //user_info.append(users_documented_status);


      member_user.append(member_icon);
      member_user.append(user_info);
      category__1.append(member_user);
    }
  }

  for(var i = 0; i < roles.length; i++){
    var category__ = document.getElementById(roles[i].name + "_category");
    if($('*[id="' + roles[i].name.replace(/ /g,"_") + '_category"]').find('.member_user').length == 0){
      document.getElementById("members_2").removeChild(document.getElementById(roles[i].name.replace(/ /g,"_") + "_category"));
    }
  }
}

function jq( myid ) {
 
  return "#" + myid.replace( /(:|\.|\[|\]|,|=|@)/g, "\\$1" );

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

        //console.log(doc.data());

        renderUserInfo(users_name, user_time, users_servers, users_id_);
    } else {
        //console.log("No such document!");
    }
  }).catch(function(error) {
      //console.log("Error getting document:", error);
  }); 
}

function renderUserInfo(users_name, user_time, users_servers, users_id_){
  var index = server_members.findIndex(x => x.uid === users_id_);
  //console.log(server_members[index]);
  var room_index = server_members[index].info.findIndex(x => x.server === room);

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

  var users_icon = document.createElement("div");
  var icon__ = document.createElement("img");
      icon__.src = server_members[index].icon;
      users_icon.append(icon__);
      users_icon.id = "users_icon_popup";

  var top_patition = document.createElement("div");
      top_patition.classList.add("user_name_card_top_patition");

  var smaller_div = document.createElement("div");
      smaller_div.classList.add("user_card_naming");

  var smol_dov = document.createElement("div");

  var users_name_popup = document.createElement("h2");
      users_name_popup.id = "user_name_card";

      if(users_name.length > 18){
        users_name_popup.innerHTML = users_name.substr(0,15) + "...";
      }else{
        users_name_popup.innerHTML = users_name;
      }

  var hash = document.createElement("p");
      //hash.innerHTML = "#";

      smol_dov.appendChild(users_name_popup);
      smol_dov.appendChild(hash);

  //console.log(server_members);
  var users_roles_ = document.createElement("div");

    server_members[index].info[room_index].roles.forEach((element) => {
      //console.log(element);
      
      var temp = document.createElement("div");
      
      var temp_text = document.createElement("p");
          temp_text.innerHTML = element.name;

      var temp_color_blob = document.createElement("div");
          temp_color_blob.classList.add("role_blob");
          temp_color_blob.style.backgroundColor = hexToRgbA(element.rgb, 0.9);

      temp.appendChild(temp_color_blob);    
      temp.appendChild(temp_text);
      // temp.style.borderColor = element.rgb;
      // temp.style.borderWidth = "1px";
      // temp.style.borderStyle = "solid";
      temp.style.backgroundColor = hexToRgbA(element.rgb, 0.1);
      users_roles_.appendChild(temp);
    });

  var message_friend = document.createElement("button");
      message_friend.classList.add("message_friend");
      message_friend.id = "user_card_message_friend";
      message_friend.classList.remove("user_card_message_friend_activated");

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
  smaller_div.append(smol_dov);
  smaller_div.append(users_roles_);
  top_patition.append(users_icon);
  top_patition.append(smaller_div);

  if(users_id_ !== user_id){
    top_patition.append(message_friend);
  }
  
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

$('#message-input').bind('keyup',function(evt){
  var key = String.fromCharCode(evt.keyCode);

  if(evt.keyCode === 50){
    $("#ping_users").removeClass("hidden");

    while(document.getElementById("ping_users").firstChild){
      document.getElementById("ping_users").removeChild(document.getElementById("ping_users").firstChild);
    }

    for(var i = 0; i < server_members.length; i++){
      var location = server_members[i].info.findIndex(element => element.server == room);

      if(location >= 0){
        var role___ = document.createElement("div");
            role___.classList.add("pingable_role");

        var role_name = document.createElement("h3");
            role_name.innerHTML = server_members[i].name; // Change to Nickname When Introducing
            role_name.style.color = "white";

        var role_desc = document.createElement("p");
            role_desc.innerHTML = server_members[i].name;
            role_desc.style.opacity = "0.2";
            
        role___.appendChild(role_name);
        role___.appendChild(role_desc);
        document.getElementById("ping_users").appendChild(role___);
      }
    }

    var separator = document.createElement("hr");
    document.getElementById("ping_users").appendChild(separator);

    roles.forEach((element, index) => {
      if(element.pingable){
        var role___ = document.createElement("div");
            role___.classList.add("pingable_role");

        var role_name = document.createElement("h3");
            role_name.innerHTML = "@" + element.name;
            role_name.style.color = element.rgb;

        var role_desc = document.createElement("p");
            role_desc.innerHTML = "Nodify users who have this role";
            role_desc.style.opacity = "0.2";
            
        role___.appendChild(role_name);
        role___.appendChild(role_desc);
        document.getElementById("ping_users").appendChild(role___);
      }
    }) 
  }
})

$('#message-input').bind('keyup',function(evt){
    //console.log(evt.keyCode);
    if(!$('#message-input').val().includes("@")){
      $("#ping_users").addClass("hidden");
    }
})


$("#account_edit h4").on('click', function() {
  $("#settings_username").toggleClass("hidden");
  $("#settings_email").toggleClass("hidden");

  $("#settings_username_input").val(username);
  $("#settings_email_input").val(user_email); 

  $("#settings_username_input").toggleClass("hidden");
  $("#settings_email_input").toggleClass("hidden");

  $("#account_edit").toggleClass("hidden");
});

$("#user_icon").on('click', function() {
  $('#upload_field_').val = "";
  $('#upload_field_').trigger('click');
  

  var docRef = db.collection("users").doc(user_id);

  docRef.get().then(function(doc) {
    $('#upload_field_').change(function(e){ 
      var image_url = doc.data().icon;

      var file = $("#upload_field_")[0].files[0];
      var extension = file.name.replace(/^.*\./, '');

      var storageRef = firebase.storage().ref();
      var imageRefrence = storageRef.child(`userIcons/${image_url}`);
      var storRef = storageRef.child(`userIcons/${user_id}.${extension.toLowerCase()}`);
      showNotitfication("", "Uploading...");

      //console.log(file);

      var newMetadata = {
        cacheControl: 'public,max-age=69000'
      }

      if(image_url !== "deafultUserIcon.jpg"){
        imageRefrence.delete().then(function() {
          storRef.put(file, newMetadata).then(function(snapshot) {
            showNotitfication("", "Applying Changes");
            var storageRef = firebase.storage().ref().child(`userIcons/${user_id}.${extension.toLowerCase()}`).getDownloadURL().then(function(url) {
              var user_loc = server_members.findIndex(obj => obj.uid === user_id);
              server_members[user_loc].icon = url;
  
              var user_servers = db.collection("users").doc(user_id);
              $("#settings_icon").attr("src", server_members[user_loc].icon);
              showNotitfication("", "Applied Changes");
              //console.log("Appling User Icon...", server_members[user_loc].icon);
            
              return user_servers.update({
                icon: `${user_id}.${extension.toLowerCase()}`
              })
            });
          });
        }).catch(function(error) {
          //console.log(error)
        });
      }else{
        storRef.put(file, newMetadata).then(function(snapshot) {
          showNotitfication("", "Applying Changes");
          var storageRef = firebase.storage().ref().child(`userIcons/${user_id}.${extension.toLowerCase()}`).getDownloadURL().then(function(url) {
            var user_loc = server_members.findIndex(obj => obj.uid === user_id);
            server_members[user_loc].icon = url;

            var user_servers = db.collection("users").doc(user_id);
            $("#settings_icon").attr("src", server_members[user_loc].icon);
            //console.log("Appling User Icon...", server_members[user_loc].icon);
            showNotitfication(server_members[user_loc].icon = url, "Applied Changes");

            return user_servers.update({
              icon: `${user_id}.${extension.toLowerCase()}`
            })
          });
        });
      }
    });   
  }).catch(function(error) {
      //'console.log("Error getting document:", error);
  });

  
})

$("#server_icon").on('click', function() {
  $('#upload_field_').val = "";
  $('#upload_field_').trigger('click');

  var docRef = db.collection("groups").doc(rmid);

  docRef.get().then(function(doc) {
    $('#upload_field_').change(function(e){ 
      console.log(doc.data());
      var image_url = doc.data().icon;

      var file = $("#upload_field_")[0].files[0];
      var extension = file.name.replace(/^.*\./, '');

      var storageRef = firebase.storage().ref();
      var imageRefrence = storageRef.child(`serverIcons/${image_url}`);
      var storRef = storageRef.child(`serverIcons/${rmid}.${extension.toLowerCase()}`);
      showNotitfication("", "Uploading...");

      //console.log(file);

      var newMetadata = {
        cacheControl: 'public,max-age=69000'
      }

      if(image_url !== "defaultServerIcon.png"){
        imageRefrence.delete().then(function() {
          storRef.put(file, newMetadata).then(function(snapshot) {
            showNotitfication("", "Applying Changes");
            var storageRef = firebase.storage().ref().child(`serverIcons/${rmid}.${extension.toLowerCase()}`).getDownloadURL().then(function(url) {
              var server_loc = servers.findIndex(obj => obj.sid === rmid);
              servers[server_loc].icon = url;
  
              var server_ = db.collection("groups").doc(rmid);
              $("#settings_overview_icon").attr("src", url);
              showNotitfication("", "Applied Changes");
              //console.log("Appling User Icon...", server_members[user_loc].icon);
            
              return server_.update({
                icon: `${rmid}.${extension.toLowerCase()}`
              })
            });
          });
        }).catch(function(error) {
          //console.log(error)
        });
      }else{
        storRef.put(file, newMetadata).then(function(snapshot) {
          showNotitfication("", "Applying Changes");
          var storageRef = firebase.storage().ref().child(`serverIcons/${rmid}.${extension.toLowerCase()}`).getDownloadURL().then(function(url) {
            var server_loc = servers.findIndex(obj => obj.sid === rmid);
              servers[server_loc].icon = url;
  
              var server_ = db.collection("groups").doc(rmid);
              $("#settings_overview_icon").attr("src", url);
              showNotitfication("", "Applied Changes");
              //console.log("Appling User Icon...", server_members[user_loc].icon);
            
              return server_.update({
                icon: `${rmid}.${extension.toLowerCase()}`
              })
          });
        });
      }
    });   
  }).catch(function(error) {
      //'console.log("Error getting document:", error);
  });

  
})

function showNotitfication(image, content) {
  //$("#success_join").css('opacity', '0');
  $("#notification_alert_title").html(content);
  $("#notification_alert").show();
  $("#notification_alert").removeClass("slide-out-top");

  setTimeout(function(){
    //$("#success_join").css('opacity', '1');
    $("#notification_alert").addClass("slide-in-top");
    
  }, 100);

  setTimeout(hideNotitfication, 5000);
}

function hideNotitfication(){
  //$("#success_join").css('opacity', '0');
  $("#notification_alert").removeClass("slide-in-top");
  $("#notification_alert").addClass("slide-out-top");

  setTimeout(function(){
    $("#notification_alert").hide();
  }, 2000);
}

function loadNews() {

}

tippy('[tooltip-content]', {
  trigger: 'mouseenter',
  onShow(instance) {
    // v5
    instance.setProps({trigger: 'click'});
    // v3-v4
    // instance.set({trigger: 'click'});
  },
  onHide(instance) {
    // v5
    instance.setProps({trigger: 'mouseenter'});
    // v3-v4
    // instance.set({trigger: 'mouseenter'});
  }
});


/*

var amOnline = new Firebase('https://fortitude-0.firebaseio.com/.info/connected');
var userRef = new Firebase('https://fortitude-0.firebaseio.com/presence/' + userid);

amOnline.on('value', function(snapshot) {
  if (snapshot.val()) {
    userRef.onDisconnect().set('☆ offline');
    userRef.set('★ online');
  }
});
document.onIdle = function () {
  userRef.set('☆ idle');
}
document.onAway = function () {
  userRef.set('☄ away');
}
document.onBack = function (isIdle, isAway) {
  userRef.set('★ online');
}

*/