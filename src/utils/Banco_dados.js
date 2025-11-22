const DB_NAME = 'app-db';
const DB_VERSION = 2;
const STORE_NAME = 'notes';
const USERS_STORE = 'users';


const CURRENT_USER_KEY = 'current_user';

async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(USERS_STORE)) {
        db.createObjectStore(USERS_STORE, { keyPath: 'username' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}



export function getCurrentUser() {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export async function registerUser(username, password) {
  if (!username || !password) {
    throw new Error('Usuário e senha são obrigatórios');
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(USERS_STORE, 'readwrite');
    const store = tx.objectStore(USERS_STORE);
    
    
    const checkReq = store.get(username);
    checkReq.onsuccess = () => {
      if (checkReq.result) {
        reject(new Error('Usuário já existe'));
        return;
      }
      
      
      const user = {
        username,
        password, 
        createdAt: new Date().toISOString()
      };
      
      const addReq = store.add(user);
      addReq.onsuccess = () => resolve(user);
      addReq.onerror = () => reject(addReq.error);
    };
    checkReq.onerror = () => reject(checkReq.error);
  });
}

export async function loginUser(username, password) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(USERS_STORE, 'readonly');
    const store = tx.objectStore(USERS_STORE);
    const req = store.get(username);
    
    req.onsuccess = () => {
      const user = req.result;
      if (!user) {
        reject(new Error('Usuário não encontrado'));
        return;
      }
      if (user.password !== password) {
        reject(new Error('Senha incorreta'));
        return;
      }
      resolve(user);
    };
    req.onerror = () => reject(req.error);
  });
}



function getUserKey(key) {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');
  return `${user.username}:${key}`;
}



export async function getNote(key) {
  if (!key) return '';
  const db = await openDB();
  const userKey = getUserKey(key);
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const r = store.get(userKey);
    r.onsuccess = () => resolve(r.result ?? '');
    r.onerror = () => reject(r.error);
  });
}

export async function saveNote(key, value) {
  if (!key) return;
  const db = await openDB();
  const userKey = getUserKey(key);
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const r = store.put(value, userKey);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}



export function getItems() {
  const user = getCurrentUser();
  if (!user) {
    console.warn('Tentou carregar itens sem estar autenticado');
    return [];
  }
  
  try {
    const key = `tabela_items_${user.username}`;
    const items = localStorage.getItem(key);
    return items ? JSON.parse(items) : [];
  } catch (e) {
    console.error('Erro ao carregar itens:', e);
    return [];
  }
}

export function saveItems(items) {
  const user = getCurrentUser();
  if (!user) {
    console.error('Tentou salvar itens sem estar autenticado');
    return;
  }
  
  try {
    const key = `tabela_items_${user.username}`;
    localStorage.setItem(key, JSON.stringify(items));
    console.log(`✓ Itens salvos para usuário: ${user.username}`);
  } catch (e) {
    console.error('Erro ao salvar itens:', e);
  }
}



export function debugShowAllUsers() {
  console.log('=== DADOS SALVOS POR USUÁRIO ===');
  const user = getCurrentUser();
  if (user) {
    console.log(`Usuário atual: ${user.username}`);
    console.log('Itens do usuário:', getItems());
  } else {
    console.log('Nenhum usuário logado');
  }
  
  
  console.log('\n=== TODAS AS CHAVES NO LOCALSTORAGE ===');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('tabela_items_')) {
      console.log(`${key}:`, JSON.parse(localStorage.getItem(key)));
    }
  }
}