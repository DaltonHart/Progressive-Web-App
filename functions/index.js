const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webpush = require('web-push');
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
        // vapid details are => email, public, private
        webpush.setVapidDetails(
          'mailto:daltonhart.j@gmail.com',
          'BCoP3DAN7ny9IbOkBU_snV6dZQIJltjL3yOpkJm-_lKttkS2IV6rzbydM9MHpdeetYJ6eaLDoshPdAK0e2bQWpw',
          '6IjrN-GYpKoZ6qS2m5orIGwGYzPV7W7rsGcyK5iwU14'
        );
        return admin
          .database()
          .ref('subscriptions')
          .once('value');
      })
      .then(subscriptions => {
        console.log(subscriptions);
        subscriptions.forEach(sub => {
          const pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh
            }
          };
          // config - payload
          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({ title: 'New Post!', content: 'New Post Added!' })
            )
            .catch(error => {
              console.log(error);
            });
        });
      })
      .catch(error => {
        console.log(error);
        res.status(500).json({ error });
      });
  });
});
