const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
);
const sharedMomentsArea = document.querySelector('#shared-moments');
const form = document.querySelector('form');
const title = document.querySelector('#title');
const location = document.querySelector('#location');

const openCreatePostModal = () => {
  createPostArea.style.display = 'block';
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(0)';
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

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (title.value.trim() === '' || location.value.trim() === '') {
    alert('Please enter valid data!');
    return;
  }
  closeCreatePostModal();
});
