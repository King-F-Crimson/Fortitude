/* eslint-disable promise/no-nesting */
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
var db = admin.firestore();

// ! Moderates messages by lowering all uppercase messages and removing swearwords.
// exports.moderator = functions.database.onWrite((change) => {
//   let message = change.after.val();
//   message = message.replace(/>/g,"&#62;");
//   message = message.replace(/</g,"&#60;");
  
//   return change.after.ref.update({
//     text: moderatedMessage
//   });
// });

// exports.sendNotification = functions.firestore 
//     .document('groups/{gid}/channels/{cid}/messages/{mid}')
//     .onWrite((change, context) => {
//         console.log(change, context);

//         //var ref = admin.database().ref(`groups/${context.params.gid}/members`);
//         //console.log(ref);

//         return false;
// });  

exports.sendNotifications = functions.firestore
      .document('groups/{groupId}/channels/{channelId}/messages/{messageId}')
      .onWrite((change, context) => {
        //console.log(`Something was sent to ${context.params.groupId} / ${context.params.channelId}`);

        var tokens_to_send = [];

        var ref = db.collection(`groups/${context.params.groupId}/members`).get()
        .then((querySnapshot) => {
                querySnapshot.forEach((element) => {
                    if(element.data().userId !== change.after.data().senderId) {
                        var docRef = db.collection("users").doc(`${element.data().userId}`);

                        docRef.get().then((doc) => {
                            //console.log(doc.data().token);
                            sendMessage(doc.data().token, change.after.data().sender, change.after.data().message, context.params.groupId, context.params.channelId, doc.data().icon);

                            return '';
                        }).catch((error) => {
                            console.log("Error getting document:", error);
                        });
                    }
                });

                return '';
        }).catch((err) => {
            console.log('Error getting documents', err);
        });
        return "Finished Function";
      });

function sendMessage(token, title, body, origin, channel, icon) {
    const payload = {
        notification: {
          title: title,
          body: body ? (body.length <= 100 ? body : body.substring(0, 97) + '...') : '',
          icon: icon,
          click_action: `https://fortitude-0.firebaseapp.com?redirect=${origin}&channel=${channel}`,
          origin: origin,
          channel: channel
        }
    };

    const response = admin.messaging().sendToDevice(token, payload);
}