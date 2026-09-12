// Storage Module: LocalStorage and IndexedDB support for local files and settings
const STORAGE_PREFIX = "musiq_";

export class StorageService {
  constructor() {
    this.dbName = "MusiqLibraryDB";
    this.dbVersion = 1;
    this.db = null;
    this.initIndexedDB();
  }

  // LocalStorage wrappers
  getItem(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn("Storage getItem error", e);
      return defaultValue;
    }
  }

  setItem(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("Storage setItem error", e);
      return false;
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (e) {
      console.warn("Storage removeItem error", e);
    }
  }

  // IndexedDB for storing offline local audio blob buffers
  initIndexedDB() {
    if (!window.indexedDB) return;
    const req = indexedDB.open(this.dbName, this.dbVersion);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("audioBlobs")) {
        db.createObjectStore("audioBlobs", { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => {
      this.db = e.target.result;
    };
    req.onerror = (e) => {
      console.warn("IndexedDB failed to open", e);
    };
  }

  async saveAudioBlob(id, blob, metadata) {
    if (!this.db) return false;
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction("audioBlobs", "readwrite");
        const store = tx.objectStore("audioBlobs");
        store.put({ id, blob, metadata, timestamp: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  async getAudioBlob(id) {
    if (!this.db) return null;
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction("audioBlobs", "readonly");
        const store = tx.objectStore("audioBlobs");
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result ? req.result.blob : null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async deleteAudioBlob(id) {
    if (!this.db) return false;
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction("audioBlobs", "readwrite");
        const store = tx.objectStore("audioBlobs");
        store.delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }
}

export const storage = new StorageService();
