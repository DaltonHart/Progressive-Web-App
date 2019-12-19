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
      body: 'You are now going to recieve notifications from PWAGram!'
    };
    navigator.serviceWorker.ready.then(swreg => {
      swreg.showNotification('Subscribed! [SW]', options);
    });
  }
  // without service worker
  // new Notification('title',options);
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
      displayConfirmationNotification();
    }
  });
};

// if notification is available
if ('Notification' in window) {
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
