'use strict';

const functions = require('firebase-functions');

// Moderates messages by lowering all uppercase messages and removing swearwords.
exports.moderator = functions.database.onWrite((change) => {
  const message = change.after.val();
  message = message.replace(/>/g,"&#62;");
  message = message.replace(/</g,"&#60;");
  
  return change.after.ref.update({
    text: moderatedMessage
  });
});
