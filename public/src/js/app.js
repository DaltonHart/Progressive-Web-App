let deferredPrompt;
let userDeny = false;

if (!window.Promise) {
  window.Promise = Promise;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(registration => {
      console.log("Registered Service Worker", registration);
    })
    .catch(err => {
      console.log(err);
    });
}

window.addEventListener("beforeinstallprompt", event => {
  console.log("beforeinstallprompt fired");
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

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
