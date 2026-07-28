import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection as realCollection,
  doc as realDoc,
  getDoc as realGetDoc,
  getDocs as realGetDocs,
  setDoc as realSetDoc,
  addDoc as realAddDoc,
  updateDoc as realUpdateDoc,
  deleteDoc as realDeleteDoc,
  query as realQuery,
  where as realWhere,
  orderBy as realOrderBy,
  onSnapshot as realOnSnapshot
} from "firebase/firestore";

const isServer = typeof window === "undefined";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// If config is missing or matches "mock", we run in mock mode
const isMock = !firebaseConfig.apiKey || 
  firebaseConfig.apiKey.includes("mock") || 
  !firebaseConfig.projectId || 
  firebaseConfig.projectId.includes("mock");

let app;
let db;

if (!isMock) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } catch (error) {
    console.error("Error initializing real Firebase:", error);
  }
}

// Helper classes for Mock Firestore
class MockDoc {
  constructor(id, dataExists, data = null) {
    this.id = id;
    this._dataExists = dataExists;
    this._data = data;
  }
  exists() {
    return this._dataExists;
  }
  data() {
    return this._data;
  }
}

class MockQuerySnapshot {
  constructor(docs = []) {
    this.docs = docs || [];
  }
  get size() {
    return this.docs.length;
  }
  forEach(callback) {
    this.docs.forEach(callback);
  }
}

// Server-side mock file DB helper
const getMockDbData = () => {
  if (!isServer) return null;
  const fs = require("fs");
  const path = require("path");
  const filePath = path.join(process.cwd(), ".mock-db.json");
  if (!fs.existsSync(filePath)) {
    const initialData = { users: {}, otps: {}, teams: [], messages: [] };
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    return { users: {}, otps: {}, teams: [], messages: [] };
  }
};

const saveMockDbData = (data) => {
  if (!isServer) return;
  const fs = require("fs");
  const path = require("path");
  const filePath = path.join(process.cwd(), ".mock-db.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Export functions checking if we are in mock mode
export { db, isMock };

export function collection(dbInstance, collectionName) {
  if (isMock) {
    return { type: "collection", name: collectionName };
  }
  return realCollection(dbInstance, collectionName);
}

export function doc(dbInstance, collectionName, docId) {
  if (isMock) {
    return { type: "doc", collectionName, id: docId };
  }
  return realDoc(dbInstance, collectionName, docId);
}

export async function getDoc(docRef) {
  if (isMock) {
    if (isServer) {
      const data = getMockDbData();
      const col = docRef.collectionName;
      const id = docRef.id;
      if (data[col]) {
        if (Array.isArray(data[col])) {
          const found = data[col].find(item => item.id === id);
          if (found) return new MockDoc(id, true, found);
        } else if (data[col][id]) {
          return new MockDoc(id, true, data[col][id]);
        }
      }
      return new MockDoc(id, false);
    } else {
      const res = await fetch(`/api/mock/db?collection=${docRef.collectionName}&id=${docRef.id}`);
      if (res.ok) {
        const body = await res.json();
        return new MockDoc(docRef.id, body.exists, body.data);
      }
      return new MockDoc(docRef.id, false);
    }
  }
  return realGetDoc(docRef);
}

export async function setDoc(docRef, dataContent) {
  if (isMock) {
    if (isServer) {
      const data = getMockDbData();
      const col = docRef.collectionName;
      const id = docRef.id;
      if (Array.isArray(data[col])) {
        const idx = data[col].findIndex(item => item.id === id);
        if (idx !== -1) {
          data[col][idx] = { id, ...dataContent };
        } else {
          data[col].push({ id, ...dataContent });
        }
      } else {
        if (!data[col]) data[col] = {};
        data[col][id] = dataContent;
      }
      saveMockDbData(data);
      return;
    } else {
      await fetch(`/api/mock/db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setDoc", collection: docRef.collectionName, id: docRef.id, data: dataContent })
      });
      return;
    }
  }
  return realSetDoc(docRef, dataContent);
}

export async function addDoc(collectionRef, dataContent) {
  if (isMock) {
    const id = Math.random().toString(36).substring(2, 11);
    if (isServer) {
      const data = getMockDbData();
      const col = collectionRef.name;
      if (Array.isArray(data[col])) {
        const newRecord = { id, ...dataContent };
        data[col].push(newRecord);
        saveMockDbData(data);
        return { id };
      } else {
        if (!data[col]) data[col] = {};
        data[col][id] = dataContent;
        saveMockDbData(data);
        return { id };
      }
    } else {
      const res = await fetch(`/api/mock/db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addDoc", collection: collectionRef.name, data: dataContent })
      });
      const body = await res.json();
      return { id: body.id };
    }
  }
  return realAddDoc(collectionRef, dataContent);
}

export async function updateDoc(docRef, dataContent) {
  if (isMock) {
    if (isServer) {
      const data = getMockDbData();
      const col = docRef.collectionName;
      const id = docRef.id;
      if (data[col]) {
        if (Array.isArray(data[col])) {
          const idx = data[col].findIndex(item => item.id === id);
          if (idx !== -1) {
            data[col][idx] = { ...data[col][idx], ...dataContent };
          }
        } else if (data[col][id]) {
          data[col][id] = { ...data[col][id], ...dataContent };
        }
        saveMockDbData(data);
      }
      return;
    } else {
      await fetch(`/api/mock/db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateDoc", collection: docRef.collectionName, id: docRef.id, data: dataContent })
      });
      return;
    }
  }
  return realUpdateDoc(docRef, dataContent);
}

export async function deleteDoc(docRef) {
  if (isMock) {
    if (isServer) {
      const data = getMockDbData();
      const col = docRef.collectionName;
      const id = docRef.id;
      if (data[col]) {
        if (Array.isArray(data[col])) {
          data[col] = data[col].filter(item => item.id !== id);
        } else if (data[col][id]) {
          delete data[col][id];
        }
        saveMockDbData(data);
      }
      return;
    } else {
      await fetch(`/api/mock/db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteDoc", collection: docRef.collectionName, id: docRef.id })
      });
      return;
    }
  }
  return realDeleteDoc(docRef);
}

export function query(collectionRef, ...queryConstraints) {
  if (isMock) {
    return { type: "query", collectionName: collectionRef.name, constraints: queryConstraints };
  }
  return realQuery(collectionRef, ...queryConstraints);
}

export function where(field, op, value) {
  if (isMock) {
    return { type: "where", field, op, value };
  }
  return realWhere(field, op, value);
}

export function orderBy(field, direction = "asc") {
  if (isMock) {
    return { type: "orderBy", field, direction };
  }
  return realOrderBy(field, direction);
}

export async function getDocs(queryRef) {
  if (isMock) {
    const colName = queryRef.collectionName || queryRef.name;
    if (isServer) {
      const data = getMockDbData();
      let list = [];
      if (Array.isArray(data[colName])) {
        list = [...data[colName]];
      } else if (data[colName]) {
        list = Object.entries(data[colName]).map(([id, val]) => ({ id, ...val }));
      }
      
      if (queryRef.constraints) {
        for (const c of queryRef.constraints) {
          if (c.type === "where") {
            list = list.filter(item => {
              const val = item[c.field];
              if (c.op === "==") return val === c.value;
              if (c.op === "array-contains") return Array.isArray(val) && val.includes(c.value);
              return true;
            });
          }
        }
      }
      return new MockQuerySnapshot(list.map(item => new MockDoc(item.id, true, item)));
    } else {
      const constraintsParam = queryRef.constraints ? encodeURIComponent(JSON.stringify(queryRef.constraints)) : "";
      const res = await fetch(`/api/mock/db?collection=${colName}&constraints=${constraintsParam}`);
      if (res.ok) {
        const body = await res.json();
        return new MockQuerySnapshot(body.docs.map(d => new MockDoc(d.id, true, d)));
      }
      return new MockQuerySnapshot([]);
    }
  }
  return realGetDocs(queryRef);
}

export function onSnapshot(queryRef, callback) {
  if (isMock) {
    if (queryRef.type === "doc") {
      const colName = queryRef.collectionName;
      const docId = queryRef.id;
      let intervalId;
      const poll = async () => {
        try {
          const res = await fetch(`/api/mock/db?collection=${colName}&id=${docId}`);
          if (res.ok) {
            const body = await res.json();
            callback(new MockDoc(docId, body.exists, body.data));
          }
        } catch (err) {
          console.error("Error polling mock database for doc:", err);
        }
      };
      poll();
      intervalId = setInterval(poll, 1000);
      return () => clearInterval(intervalId);
    }

    const colName = queryRef.collectionName || queryRef.name;
    let constraints = queryRef.constraints || [];
    
    const teamIdConstraint = constraints.find(c => c.field === "teamId" && c.op === "==");
    const teamId = teamIdConstraint ? teamIdConstraint.value : null;
    const userEmailConstraint = constraints.find(c => c.field === "userEmail" && c.op === "==");
    const userEmail = userEmailConstraint ? userEmailConstraint.value : null;

    let intervalId;
    const poll = async () => {
      try {
        let url = `/api/mock/db?collection=${colName}`;
        if (teamId) {
          url += `&teamId=${teamId}`;
        }
        if (userEmail) {
          url += `&userEmail=${encodeURIComponent(userEmail)}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const body = await res.json();
          let docs = body.docs;
          if (constraints.length > 0) {
            constraints.forEach(c => {
              if (c.type === "where") {
                docs = docs.filter(item => {
                  const val = item[c.field];
                  if (c.op === "==") return val === c.value;
                  if (c.op === "array-contains") return Array.isArray(val) && val.includes(c.value);
                  return true;
                });
              }
            });
          }
          callback(new MockQuerySnapshot(docs.map(d => new MockDoc(d.id, true, d))));
        }
      } catch (err) {
        console.error("Error polling mock database:", err);
      }
    };
    poll();
    intervalId = setInterval(poll, 1000);
    return () => clearInterval(intervalId);
  }
  return realOnSnapshot(queryRef, callback);
}

