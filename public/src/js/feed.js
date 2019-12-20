const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
);
const sharedMomentsArea = document.querySelector('#shared-moments');
const form = document.querySelector('form');
const titleInput = document.querySelector('#title');
const locationInput = document.querySelector('#location');
const videoPlayer = document.querySelector('#player');
const canvasElement = document.querySelector('#canvas');
const captureButton = document.querySelector('#capture-btn');
const imagePicker = document.querySelector('#image-picker');
const imagePickerArea = document.querySelector('#pick-image');
let picture;
const locationBtn = document.querySelector('#location-btn');
const locationLoader = document.querySelector('#location-loader');
let fetchedLocation = { latitude: 0, longitude: 0 };

locationBtn.addEventListener('click', event => {
  if (!('geolocation' in navigator)) {
    return;
  }
  locationBtn.style.display = 'none';
  locationLoader.style.display = 'block';
  navigator.geolocation.getCurrentPosition(
    position => {
      locationBtn.style.display = 'inline';
      locationLoader.style.display = 'none';
      fetchedLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      locationInput.value = position.coords.latitude;
      document.querySelector('#manual-location').classList.add('is-focused');
      console.log(position);
    },
    error => {
      console.log(error);
      locationBtn.style.display = 'inline';
      locationLoader.style.display = 'none';
      fetchedLocation = { latitude: 0, longitude: 0 };
    },
    { timeout: 7000 }
  );
});

const initiaLocation = () => {
  if (!('geolocation' in navigator)) {
    locationBtn.style.display = 'none';
  }
};

const initialMedia = () => {
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = constraints => {
      const getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia not available'));
      }

      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(stream => {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch(err => {
      imagePickerArea.style.display = 'block';
    });
};

captureButton.addEventListener('click', event => {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';
  const context = canvasElement.getContext('2d');
  context.drawImage(
    videoPlayer,
    0,
    0,
    canvas.width,
    videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width)
  );
  videoPlayer.srcObject.getVideoTracks().forEach(track => {
    track.stop();
  });
  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener('change', event => {
  picture = event.target.files[0];
});

const openCreatePostModal = () => {
  createPostArea.style.display = 'block';
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(0)';
    initialMedia();
    initiaLocation();
  }, 1);
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(choiceResult => {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }
};

const closeCreatePostModal = () => {
  createPostArea.style.transform = 'translateY(100vh)';
  imagePickerArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
  captureButton.style.display = 'inline';
  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(track => {
      track.stop();
    });
  }
};

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// NOTE not in use. Allows save to cache on demand.
const onSaveButtonClicked = event => {
  console.log('clicked');
  if ('caches' in window) {
    caches.open('user-requested').then(cache => {
      cache.add('https://httpbin.org/get');
      cache.add('/src/images/sf-boat.jpg');
    });
  }
};

const clearCards = () => {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
};

const createCard = ({ image, location, title, id }) => {
  const cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  const cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url("${image}")`;
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  const cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = title;
  cardTitle.appendChild(cardTitleTextElement);
  const cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = location;
  cardSupportingText.style.textAlign = 'center';
  // const cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
};

const updateUi = data => {
  clearCards();
  data.forEach(post => createCard(post));
};

const url = 'https://pwagram-88a38.firebaseio.com/posts.json';
let networkDataRecieved = false;

//NOTE regular request
fetch(url)
  .then(res => {
    return res.json();
  })
  .then(data => {
    networkDataRecieved = true;
    let dataArr = [];
    for (let key in data) {
      dataArr.push(data[key]);
    }
    updateUi(dataArr);
  });

// NOTE indexDb with network fallback
if ('indexedDB' in window) {
  readAllData('posts').then(data => {
    if (!networkDataRecieved) {
      console.log('from Cache', data);
      updateUi(data);
    }
  });
}

const sendData = () => {
  const id = new Date().toISOString();
  const postData = new FormData();
  postData.append('id', id);
  postData.append('title', titleInput.value);
  postData.append('location', locationInput.value);
  postData.append('file', picture, `${id}.png`);
  postData.append('rawLocationLat', fetchedLocation.latitude);
  postData.append('rawLocationLng', fetchedLocation.longitude);

  fetch('https://us-central1-pwagram-88a38.cloudfunctions.net/storePostData', {
    method: 'POST',
    body: postData
  })
    .then(res => {
      console.log(res);
      updateUi();
    })
    .catch(err => {
      console.log(err);
    });
};

form.addEventListener('submit', e => {
  e.preventDefault();
  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid data!');
    return;
  }
  closeCreatePostModal();
  // validate sw and sync are available in the browser
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    // due to sw not being able to normally sync this type of request from the form we create a sync event
    navigator.serviceWorker.ready.then(sw => {
      const post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        picture: picture,
        rawLocation: fetchedLocation
      };
      // write the post to the indexDb in the sync table
      writeData('sync-posts', post)
        .then(() => {
          // we register a sync event for the sw to listen for
          return sw.sync.register('sync-new-posts').then(() => {
            // once sync has occured take that info and update the dom
            const snackbarContainer = document.querySelector(
              '#confirmation-toast'
            );
            const data = { message: 'Your message was saved for sync!' };
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          });
        })
        .catch(err => {
          console.log(err);
        });
    });
  } else {
    sendData();
  }
});
