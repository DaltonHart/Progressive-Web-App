// import scripts allows to bring in other files and break up our code
// import idb to handle index data base functions
importScripts('/src/js/idb.js');
// improt utility for all db functionality
importScripts('/src/js/utility.js');

const CACHE_STATIC_NAME = 'static-v1';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';
const CACHED_STATIC_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/utility.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];
const CACHE_LIMIT = 20;

// NOTE Currently not in use
// const trimCache = (cacheName, maxItems) => {
//   caches.open(cacheName).then(cache => {
//     return cache.keys().then(keys => {
//       if (keys.length > maxItems) {
//         cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
//       }
//     });
//   });
// };

self.addEventListener('install', event => {
  // console.log("[Service Worker] Installing service worker...", event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(cache => {
      console.log('[Service Worker] Precaching App Shell');
      // NOTE  precaches application shell
      cache.addAll(CACHED_STATIC_URLS);
    })
  );
});

self.addEventListener('activate', event => {
  // console.log("[Service Worker] Activating service worker...", event);
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// NOTE helper method to ensure string is in cached array
const isInArray = (string, array) => {
  let cachePath;
  if (string.indexOf(self.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    // console.log('matched ', string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
};

// NOTE Cache than network strategy with offline support. Set up with fetch.js
// you have to specify the url to add the listener to
self.addEventListener('fetch', event => {
  const url = 'https://pwagram-88a38.firebaseio.com/posts.json';
  // cache then network strategy for selected url
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request).then(res => {
        const clonesRes = res.clone();
        clearAllData('posts')
          .then(() => {
            return clonesRes.json();
          })
          .then(data => {
            for (key in data) {
              writeData('posts', data[key]);
            }
          });
        return res;
      })
    );
  }
  // adds cache only for static cached files only update with new service worker install
  else if (isInArray(event.request.url, CACHED_STATIC_URLS)) {
    event.respondWith(caches.match(event.request));
  } else {
    // cache with network fallback
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(res => {
              return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
                // trimCache(CACHE_DYNAMIC_NAME, CACHE_LIMIT);
                cache.put(event.request.url, res.clone());
                return res;
              });
            })
            .catch(err => {
              return caches.open(CACHE_STATIC_NAME).then(cache => {
                if (event.request.headers.get('accept').includes('text/html')) {
                  return cache.match('/offline.html');
                }
              });
            });
        }
      })
    );
  }
});

// NOTE Cache than network strategy. Set up with fetch.js
// this is super fast but does not offer offline support.
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     caches.open(CACHE_DYNAMIC_NAME).then(cache => {
//       return fetch(event.request).then(res => {
//         cache.put(event.request, res.clone());
//         return res;
//       });
//     })
//   );
// });

// NOTE strategy service worker only

// self.addEventListener('fetch', event => {
//   event.respondWith(
//     caches.match(event.request).then(response => {
//       if (response) {
//         return response;
//       } else {
//         return fetch(event.request)
//           .then(res => {
//             return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
//               cache.put(event.request.url, res.clone());
//               return res;
//             });
//           })
//           .catch(err => {
//             return caches.open(CACHE_STATIC_NAME).then(cache => {
//               return cache.match('/offline.html');
//             });
//           });
//       }
//     })
//   );
// });

//NOTE cache only strategy (doesnt make much sense to use)

// self.addEventListener('fetch', event => {
//   event.respondWith(caches.match(event.request));
// });

// NOTE network only strategy (doesnt make much sense to use)

// self.addEventListener('fetch', event => {
//   event.respondWith(fetch(event.request));
// });

// NOTE network with cache fallback strategy (not very common)
// used as fallback not as main source. does not load as fast
// also is slow on reverse network fallback due to response timeouts. will only trigger cache after timeout completes

// self.addEventListener('fetch', event => {
//   event.respondWith(
//     fetch(event.request).catch(err => {
//       return caches.match(event.request);
//     })
//   );
// });

// Add listener for internet connectivity
self.addEventListener('sync', event => {
  console.log('[Service Worker] background sync..');
  // look for tag we set on sw register sync
  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] sync new post');
    // wait to complete event with the following
    event.waitUntil(
      // get all synced posts
      readAllData('sync-posts').then(data => {
        // loop through all and send to db
        for (let dt of data) {
          const postData = new FormData();
          postData.append('id', dt.id);
          postData.append('title', dt.title);
          postData.append('location', dt.location);
          postData.append('file', dt.picture, `${dt.id}.png`);
          postData.append('rawLocationLat', dt.rawLocation.latitude);
          postData.append('rawLocationLng', dt.rawLocation.longitude);
          fetch(
            'https://us-central1-pwagram-88a38.cloudfunctions.net/storePostData',
            {
              method: 'POST',
              body: postData
            }
          )
            .then(res => {
              // if res is ok delete from sync db
              console.log(res.ok, res);
              if (res.ok) {
                res.json().then(data => {
                  console.log('deleteing', data);
                  deleteItemFromData('sync-posts', data.id);
                });
              }
            })
            .catch(err => {
              console.log(err);
            });
        }
      })
    );
  }
});

// listener for notifications
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const action = event.action;

  console.log(notification, '[SW] notification handle');

  if (action === 'id') {
    console.log('confirm was chosen');
    notification.close();
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll().then(clis => {
        let client = clis.find(c => {
          return c.visibilityState === 'visible';
        });
        if (client !== 'undefined') {
          client.navigate(notification.data.url);
          client.focus();
        } else {
          clients.openWindow(notification.data.url);
        }
        notification.close();
      })
    );
  }
});

// listener for closing notification
self.addEventListener('notificationclick', event => {
  console.log('Notificatino was closed', event);
});

// listener for push
self.addEventListener('push', event => {
  console.log('[SW] Push notification recieved', event, event.data.text());
  let data = {
    title: 'New!',
    content: 'Something new happened!',
    openUrl: '/'
  };
  if (event.data) {
    data = JSON.parse(event.data.text());
  }
  const options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    // data can be any data you want
    data: {
      url: data.openUrl
    }
  };
  // this will send the notification
  event.waitUntil(self.registration.showNotification(data.title, options));
});
