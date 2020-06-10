const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

exports.messageNotification = functions.firestore
    .document('groups/{serverId}/messages/{messageId}')
    .onCreate((change, context) => {
        // If we set `/users/marie/incoming_messages/134` to {body: "Hello"} then
        // context.params.userId == "marie";
        // context.params.messageCollectionId == "incoming_messages";
        // context.params.messageId == "134";
        // ... and ...
        // change.after.data() == {body: "Hello"}

        //console.log(change);
        //console.log(context);

        //console.log("MID:", context.params.messageId);
        //console.log("SID:", context.params.serverId);

        
        var adress = `groups/${context.params.serverId}/messages/${context.params.messageId}`;
        console.log(adress);

        const payload = {
            notification: {
              title: 'Notification!',
              body: `${follower.displayName} is now following you.`,
              icon: follower.photoURL
            }
          };

        return admin.messaging().send(payload);
    });
