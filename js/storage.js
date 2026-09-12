// Storage Module: LocalStorage and IndexedDB support for local files and settings
const STORAGE_PREFIX = "musiq_";

export class StorageService {
  constructor() {
    this.dbName = "MusiqLibraryDB";
    this.dbVersion = 1;
    this.db = null;
    this.dbReady = this.initIndexedDB();
  }

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
    try { localStorage.removeItem(STORAGE_PREFIX + key); } catch (e) {
      console.warn("Storage removeItem error", e);
    }
  }

  initIndexedDB() {
    if (!window.indexedDB) return Promise.resolve(null);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (db) => {
        if (!settled) { settled = true; resolve(db || null); }
      };
      let req;
      try { req = indexedDB.open(this.dbName, this.dbVersion); } catch (e) {
        console.warn("IndexedDB open failed", e);
        finish(null); return;
      }
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("audioBlobs")) {
          db.createObjectStore("audioBlobs", { keyPath: "id" });
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        this.db.onversionchange = () => this.db?.close();
        finish(this.db);
      };
      req.onerror = () => {
        console.warn("IndexedDB failed to open", req.error);
        finish(null);
      };
      req.onblocked = () => console.warn("IndexedDB open is blocked by another connection");
    });
  }

  async ready() {
    if (this.db) return this.db;
    return this.dbReady;
  }

  async saveAudioBlob(id, blob, metadata) {
    const db = await this.ready();
    if (!db || !id || !blob) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction("audioBlobs", "readwrite");
        tx.objectStore("audioBlobs").put({ id, blob, metadata, timestamp: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch (e) { resolve(false); }
    });
  }

  async getAudioBlob(id) {
    const db = await this.ready();
    if (!db || !id) return null;
    return new Promise((resolve) => {
      try {
        const req = db.transaction("audioBlobs", "readonly").objectStore("audioBlobs").get(id);
        req.onsuccess = () => resolve(req.result?.blob || null);
        req.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  }

  async getAllAudioRecords() {
    const db = await this.ready();
    if (!db) return [];
    return new Promise((resolve) => {
      try {
        const req = db.transaction("audioBlobs", "readonly").objectStore("audioBlobs").getAll();
        req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
        req.onerror = () => resolve([]);
      } catch (e) { resolve([]); }
    });
  }

  async deleteAudioBlob(id) {
    const db = await this.ready();
    if (!db || !id) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction("audioBlobs", "readwrite");
        tx.objectStore("audioBlobs").delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch (e) { resolve(false); }
    });
  }
}

export const storage = new StorageService();
