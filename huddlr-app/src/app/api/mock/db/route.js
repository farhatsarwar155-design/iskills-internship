import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return await verifyJWT(token);
  } catch (err) {
    return null;
  }
}

const getMockDbData = () => {
  const filePath = path.join(process.cwd(), ".mock-db.json");
  if (!fs.existsSync(filePath)) {
    const initialData = { users: {}, otps: {}, teams: [], messages: [], tasks: [], meetings: [], notifications: [] };
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    return { users: {}, otps: {}, teams: [], messages: [], tasks: [], meetings: [], notifications: [] };
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

  if (teamId) {
    docs = docs.filter(m => m.teamId === teamId);
  }

  const userEmail = searchParams.get("userEmail");
  if (userEmail) {
    docs = docs.filter(m => m.userEmail === userEmail);
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

  // Security check for meetings collection
  if (col === "meetings") {
    if (action === "updateDoc" || action === "deleteDoc") {
      const user = await getAuthUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const meeting = Array.isArray(data[col])
        ? data[col].find(item => item.id === id)
        : data[col]?.[id];
        
      if (meeting) {
        const isHost = meeting.hostId === user.email || meeting.createdBy === user.email;
        if (!isHost) {
          return NextResponse.json({ error: "Forbidden: Only the host can modify this meeting" }, { status: 403 });
        }
      }
    } else if (action === "addDoc") {
      const user = await getAuthUser();
      if (user && payload) {
        payload.hostId = user.email;
        payload.createdBy = user.email;
      }
    }
  }

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

  if (action === "updateDoc") {
    if (data[col]) {
      if (Array.isArray(data[col])) {
        const idx = data[col].findIndex(item => item.id === id);
        if (idx !== -1) {
          data[col][idx] = { ...data[col][idx], ...payload };
        }
      } else if (data[col][id]) {
        data[col][id] = { ...data[col][id], ...payload };
      }
      saveMockDbData(data);
    }
    return NextResponse.json({ success: true });
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
