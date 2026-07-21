import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const getMockDbData = () => {
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
  const filePath = path.join(process.cwd(), ".mock-db.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const col = searchParams.get("collection");
  const id = searchParams.get("id");
  const teamId = searchParams.get("teamId");

  if (!col) {
    return NextResponse.json({ error: "Missing collection" }, { status: 400 });
  }

  const data = getMockDbData();

  if (id) {
    if (data[col]) {
      if (Array.isArray(data[col])) {
        const found = data[col].find(item => item.id === id);
        if (found) return NextResponse.json({ exists: true, data: found });
      } else if (data[col][id]) {
        return NextResponse.json({ exists: true, data: data[col][id] });
      }
    }
    return NextResponse.json({ exists: false, data: null });
  }

  let docs = [];
  if (Array.isArray(data[col])) {
    docs = [...data[col]];
  } else if (data[col]) {
    docs = Object.entries(data[col]).map(([docId, val]) => ({ id: docId, ...val }));
  }

  if (teamId && col === "messages") {
    docs = docs.filter(m => m.teamId === teamId);
  }

  return NextResponse.json({ docs });
}

export async function POST(request) {
  const body = await request.json();
  const { action, collection: col, id, data: payload } = body;

  if (!col) {
    return NextResponse.json({ error: "Missing collection" }, { status: 400 });
  }

  const data = getMockDbData();

  if (action === "setDoc") {
    if (Array.isArray(data[col])) {
      const idx = data[col].findIndex(item => item.id === id);
      if (idx !== -1) {
        data[col][idx] = { id, ...payload };
      } else {
        data[col].push({ id, ...payload });
      }
    } else {
      if (!data[col]) data[col] = {};
      data[col][id] = payload;
    }
    saveMockDbData(data);
    return NextResponse.json({ success: true });
  }

  if (action === "addDoc") {
    const docId = Math.random().toString(36).substring(2, 11);
    if (Array.isArray(data[col])) {
      data[col].push({ id: docId, ...payload });
    } else {
      if (!data[col]) data[col] = {};
      data[col][docId] = payload;
    }
    saveMockDbData(data);
    return NextResponse.json({ id: docId });
  }

  if (action === "deleteDoc") {
    if (data[col]) {
      if (Array.isArray(data[col])) {
        data[col] = data[col].filter(item => item.id !== id);
      } else if (data[col][id]) {
        delete data[col][id];
      }
      saveMockDbData(data);
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
