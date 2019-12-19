const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const serviceAccount = require('./pwagram-88a38-firebase-adminsdk-vqjot-c333aae033.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwagram-88a38.firebaseio.com/'
});

exports.storePostData = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    admin
      .database()
      .ref('posts')
      .push({
        id: req.body.id,
        title: req.body.title,
        location: req.body.location,
        image: req.body.image
      })
      .then(() => {
        res.status(200).json({ message: 'Data Stored', id: request.body.id });
      })
      .catch(error => {
        res.status(500).json({ error });
      });
  });
});
