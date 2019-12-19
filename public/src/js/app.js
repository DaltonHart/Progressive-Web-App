let deferredPrompt;
let userDeny = false;

// grab notification buttons
const enableNotificationsButtons = document.querySelectorAll(
  '.enable-notifications'
);

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(registration => {
      console.log('Registered Service Worker', registration);
    })
    .catch(err => {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', event => {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

// confirmation notification
const displayConfirmationNotification = () => {
  // through service worker
  if ('serviceWorker' in navigator) {
    const options = {
      body: 'You are now going to recieve notifications from PWAGram!', // inside the content of the notification
      icon: '/src/images/icons/app-icon-96x96.png', // icon to show to right or left of content
      image: '/src/images/sf-boat.jpg', // will show up in the content
      dir: 'ltr', // direction text is read
      lang: 'en-US', // BCP 47
      vibration: [100, 50, 200], // in ms vibrate, pause , vibrate
      badge: '/src/images/icons/app-icon-96x96.png', // badge to show in android
      tag: 'confirm-notification',
      renotify: true, // renotify the user if a notificaton with tag exists
      // actions allow the user to select buttons on the notification
      // these should never be core features since it is not always available
      // to listen to these clicks we must handle it in the service worker
      actions: [
        {
          action: 'id',
          title: 'Confirm!',
          icon: '/src/images/icons/app-icon-96x96.png'
        },
        {
          action: 'id2',
          title: 'Display Another Text!',
          icon: '/src/images/icons/app-icon-96x96.png'
        }
      ]
    };
    navigator.serviceWorker.ready.then(swreg => {
      swreg.showNotification('Subscribed! [SW]', options);
    });
  }
  // without service worker
  // new Notification('title',options);
};

// configure the push notification and set up subscription for live notifications

const configurePushSub = () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  let reg;
  navigator.serviceWorker.ready
    .then(swreg => {
      reg = swreg;
      return swreg.pushManager.getSubscription();
    })
    .then(sub => {
      if (sub === null) {
        // store public vapid key for security
        const vapidPublicKey =
          'BCoP3DAN7ny9IbOkBU_snV6dZQIJltjL3yOpkJm-_lKttkS2IV6rzbydM9MHpdeetYJ6eaLDoshPdAK0e2bQWpw';
        const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
        //create sub
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey
        });
      } else {
        // we have a sub
      }
    })
    .then(newSub => {
      // post the new sub to our db so we know where to send the notification to
      return fetch('https://pwagram-88a38.firebaseio.com/subscriptions.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(newSub)
      });
    })
    .then(res => {
      // if success display confirmation
      if (res.ok) {
        displayConfirmationNotification();
      }
    })
    .catch(error => {
      console.log(error);
    });
};

// ask for notification permissions
const askForNotificationPermission = () => {
  Notification.requestPermission(result => {
    console.log('User Choice', result);
    if (result !== 'granted') {
      console.log('No notification permission granted.');
    } else {
      // hide buttons
      // send confirmation notification
      // displayConfirmationNotification();

      // configure subscription
      configurePushSub();
    }
  });
};

// if notification is available
if ('Notification' in window && 'serviceWorker' in navigator) {
  for (let i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = 'inline-block';
    enableNotificationsButtons[i].addEventListener(
      'click',
      askForNotificationPermission
    );
  }
}

// NOTE fetch examples
// fetch("https://httpbin.org/ip")
//   .then(response => response.json())
//   .then(data => console.log(data))
//   .catch(error => console.log(error));

// fetch("https://httpbin.org/post", {
//   method: "POST",
//   headers: {
//     "Content-Type": "aplication/json",
//     //prettier-ignore
//     "Accept": "application/json"
//   },
//   body: JSON.stringify({ message: "Does this work?" }),
//   mode: "cors"
// })
//   .then(response => response.json())
//   .then(data => console.log(data))
//   .catch(error => console.log(error));

// NOTE ajax can not be used due to the sync code it uses in service workers
// const xhr = new XMLHttpRequest();
// xhr.open("GET", "https://httpbin.org/ip");
// xhr.responseType = "json";

// xhr.onload = () => {
//   console.log(xhr.response);
// };

// xhr.onerror = () => {
//   console.log("ERROR");
// };

// xhr.send();
