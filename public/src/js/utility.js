// arguments for .open => db name - version - callback
const dbPromise = idb.open('posts-store', 1, function(db) {
  // if posts table in db does not exist create it
  if (!db.objectStoreNames.contains('posts')) {
    // creates a table of posts with inde path of id
    db.createObjectStore('posts', { keyPath: 'id' });
  }
});

// write data is a function to handle db write
const writeData = (storeName, data) => {
  return dbPromise.then(db => {
    // create transaction a args => store to connect with what you will do
    const tx = db.transaction(storeName, 'readwrite');
    // access store
    const store = tx.objectStore(storeName);
    // put data into store
    store.put(data);
    // close transaction
    return tx.complete;
  });
};
