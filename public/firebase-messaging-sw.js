// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/7.15.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.15.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyA0Mm7tzst4UDkc7niW1HxZMQDirbA7VIc",
    authDomain: "fortitude-0.firebaseapp.com",
    databaseURL: "https://fortitude-0.firebaseio.com",
    projectId: "fortitude-0",
    storageBucket: "fortitude-0.appspot.com",
    messagingSenderId: "1039342345774",
    appId: "1:1039342345774:web:12a14ae9dfc0453de709bf",
    measurementId: "G-3TELB2WL73"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();