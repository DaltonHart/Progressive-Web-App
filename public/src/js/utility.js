// arguments for .open => db name - version - callback
const dbPromise = idb.open('posts-store', 1, function(db) {
  /* ---- Tables for data ---- */
  // if posts table in db does not exist create it
  if (!db.objectStoreNames.contains('posts')) {
    // creates a table of posts with inde path of id
    db.createObjectStore('posts', { keyPath: 'id' });
  }
  /* ---- Sync table for offline sync  ---- */
  // if posts-sync table in db does not exist create it
  if (!db.objectStoreNames.contains('sync-posts')) {
    // creates a table of posts with inde path of id
    db.createObjectStore('sync-posts', { keyPath: 'id' });
  }
});

// write data is a function to handle db write
const writeData = (storeName, data) => {
  return dbPromise.then(db => {
    // create a transaction args => store to connect, with what you will do
    const tx = db.transaction(storeName, 'readwrite');
    // access store
    const store = tx.objectStore(storeName);
    // put data into store
    store.put(data);
    // return and close transaction for db integrity
    return tx.complete;
  });
};

// read all data is a function that will recieve all the data from a store
const readAllData = storeName => {
  return dbPromise.then(db => {
    // create a transaction - args => store to connect, with what you will do
    const tx = db.transaction(storeName, 'readonly');
    // access store
    const store = tx.objectStore(storeName);
    // get all data from db and respond with data
    // no need to complete transaction due to never writing data so db is safe
    return store.getAll();
  });
};

// clear all data will empty a store with a given name
const clearAllData = storeName => {
  return dbPromise.then(db => {
    // create a transaction - args => store to connect, with what you will do
    const tx = db.transaction(storeName, 'readwrite');
    // access store
    const store = tx.objectStore(storeName);
    // clear data in store
    store.clear();
    // return and close transaction for db integrity
    return tx.complete;
  });
};

// deletes a single item from store with given id
const deleteItemFromData = (storeName, id) => {
  return dbPromise.then(db => {
    // create a transaction - args => store to connect, with what you will do
    const tx = db.transaction(storeName, 'readwrite');
    // access store
    const store = tx.objectStore(storeName);
    // deletes with given id
    store.delete(id);
    // return and close transaction for db integrity
    return tx.complete;
  });
};

// convert base 64 to unit 8 array for push manager
const urlBase64ToUint8Array = base64String => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};
