"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { db, collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "@/lib/firebase";

export default function NotificationsDropdown({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen to notifications
  useEffect(() => {
    if (!currentUser?.email) return;

    const notifsRef = collection(db, "notifications");
    const q = query(
      notifsRef,
      where("userEmail", "==", currentUser.email),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = [];
      snapshot.forEach((docSnap) => {
        notifs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        const notifDocRef = doc(db, "notifications", notif.id);
        await updateDoc(notifDocRef, { read: true });
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }
    setIsOpen(false);
    // Note: depending on the notification type, we might want to trigger navigation or tab switching here.
  };

  const getIcon = (type) => {
    switch (type) {
      case "task": return <CheckCircle size={16} className="text-emerald-400" />;
      case "meeting": return <Clock size={16} className="text-purple-400" />;
      case "chat": return <MessageSquare size={16} className="text-indigo-400" />;
      default: return <Bell size={16} className="text-zinc-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-white transition-all cursor-pointer rounded-xl hover:bg-zinc-800"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-zinc-900 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 cursor-pointer transition-colors flex gap-3 ${!notif.read ? 'bg-zinc-800/30' : ''}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.read ? 'text-white font-medium' : 'text-zinc-300'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-2">
                      {new Date(notif.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
