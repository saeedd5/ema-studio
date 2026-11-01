/**
 * storage.js
 * سیستم ذخیره‌سازی محلی برای ماندگاری فایل‌های صوتی، تصاویر و تنظیمات
 */

const DB_NAME = 'EmmaStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'project_media';

// باز کردن یا ساخت پایگاه داده IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const Storage = {
  // ۱. ذخیره و بازیابی تنظیمات متنی ساده (نام برند، زیرنویس‌ها، ولوم‌ها)
  saveSetting(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('خطا در ذخیره LocalStorage:', e);
    }
  },

  getSetting(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      return fallback;
    }
  },

  // ۲. ذخیره فایل‌های باینری سنگین (ArrayBuffer صدا و عکس‌ها) در IndexedDB
  async saveMedia(key, fileOrBlob, fileName = '') {
    const db = await openDB();
    const buffer = fileOrBlob instanceof ArrayBuffer ? fileOrBlob : await fileOrBlob.arrayBuffer();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ buffer, name: fileName, type: fileOrBlob.type }, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  // بازیابی فایل باینری
  async getMedia(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  // حذف یک فایل
  async removeMedia(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  // پاک‌سازی کامل دیتابیس برای شروع پروژه جدید
  async clearAll() {
    localStorage.clear();
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },



  // ذخیره شیء پوشه (Directory Handle) در IndexedDB
  async saveHandle(key, handle) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ handle }, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  // بازیابی شیء پوشه پروژه
  async getHandle(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result?.handle || null);
      req.onerror = () => reject(tx.error);
    });
  },



};