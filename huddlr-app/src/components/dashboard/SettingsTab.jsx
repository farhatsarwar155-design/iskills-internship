"use client";

import { useState, useEffect, useRef } from "react";
import { db, doc, updateDoc } from "@/lib/firebase";
import { 
  User, Shield, Bell, Palette, Users, Camera, Loader, 
  AlertTriangle, CheckCircle, Trash2, LogOut, Edit3, Settings 
} from "lucide-react";

export default function SettingsTab({ currentUser, onUserUpdate, selectedTeam, onTeamUpdate, onLeaveTeam }) {
  const [activeSubTab, setActiveSubTab] = useState("profile");
  
  // Profile Form State
  const [displayName, setDisplayName] = useState(currentUser?.name || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [profilePicture, setProfilePicture] = useState(currentUser?.profilePicture || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState({
    taskAssigned: currentUser?.notifications?.taskAssigned ?? true,
    meetingReminders: currentUser?.notifications?.meetingReminders ?? true,
    chatMessages: currentUser?.notifications?.chatMessages ?? true,
    documentUploads: currentUser?.notifications?.documentUploads ?? true,
    voiceNotes: currentUser?.notifications?.voiceNotes ?? true,
    desktopNotifications: currentUser?.notifications?.desktopNotifications ?? true,
    emailNotifications: currentUser?.notifications?.emailNotifications ?? true,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  // Appearance State
  const [theme, setTheme] = useState(currentUser?.theme || "dark");
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  // Team Settings State
  const [teamName, setTeamName] = useState(selectedTeam?.name || "");
  const [isSavingTeamName, setIsSavingTeamName] = useState(false);
  const [teamSuccess, setTeamSuccess] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeavingTeam, setIsLeavingTeam] = useState(false);

  // Sync state if currentUser prop changes
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.name || "");
      setBio(currentUser.bio || "");
      setProfilePicture(currentUser.profilePicture || "");
      setNotifications({
        taskAssigned: currentUser.notifications?.taskAssigned ?? true,
        meetingReminders: currentUser.notifications?.meetingReminders ?? true,
        chatMessages: currentUser.notifications?.chatMessages ?? true,
        documentUploads: currentUser.notifications?.documentUploads ?? true,
        voiceNotes: currentUser.notifications?.voiceNotes ?? true,
        desktopNotifications: currentUser.notifications?.desktopNotifications ?? true,
        emailNotifications: currentUser.notifications?.emailNotifications ?? true,
      });
      setTheme(currentUser.theme || "dark");
    }
  }, [currentUser]);

  // Sync team state if selectedTeam changes
  useEffect(() => {
    if (selectedTeam) {
      setTeamName(selectedTeam.name || "");
    }
  }, [selectedTeam]);

  // Handle Profile Picture selection
  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      setProfilePicture(evt.target?.result);
    };
    reader.readAsDataURL(file);
  };

  // Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingProfile(true);
    setProfileSuccess(false);

    try {
      const userRef = doc(db, "users", currentUser.email);
      const updateData = {
        name: displayName.trim(),
        bio: bio.trim(),
        profilePicture
      };
      await updateDoc(userRef, updateData);
      
      onUserUpdate(updateData);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to save profile. Try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE PERMANENTLY") {
      alert("Please type 'DELETE PERMANENTLY' to confirm.");
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }
      // Redirect to login page or reload
      window.location.href = "/login";
    } catch (err) {
      alert(err.message);
      setIsDeletingAccount(false);
    }
  };

  // Toggle Notification setting
  const toggleNotification = async (key) => {
    if (!currentUser) return;
    const updatedNotifications = {
      ...notifications,
      [key]: !notifications[key]
    };
    setNotifications(updatedNotifications);
    setIsSavingNotifications(true);
    setNotifSuccess(false);

    try {
      const userRef = doc(db, "users", currentUser.email);
      await updateDoc(userRef, { notifications: updatedNotifications });
      onUserUpdate({ notifications: updatedNotifications });
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to update notification settings", err);
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Toggle Theme
  const toggleTheme = async (selectedTheme) => {
    if (!currentUser || isSavingTheme) return;
    setTheme(selectedTheme);
    setIsSavingTheme(true);

    try {
      const userRef = doc(db, "users", currentUser.email);
      await updateDoc(userRef, { theme: selectedTheme });
      onUserUpdate({ theme: selectedTheme });

      // Apply/remove .light class
      const htmlEl = document.documentElement;
      if (selectedTheme === "light") {
        htmlEl.classList.add("light");
      } else {
        htmlEl.classList.remove("light");
      }
    } catch (err) {
      console.error("Failed to update theme preference", err);
    } finally {
      setIsSavingTheme(false);
    }
  };

  // Update Team Name
  const handleUpdateTeamName = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setIsSavingTeamName(true);
    setTeamSuccess(false);
    setTeamError("");

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeam.id, name: teamName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update team name");

      onTeamUpdate({ ...selectedTeam, name: data.name });
      setTeamSuccess(true);
      setTimeout(() => setTeamSuccess(false), 3000);
    } catch (err) {
      setTeamError(err.message);
    } finally {
      setIsSavingTeamName(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberEmail) => {
    if (!selectedTeam) return;
    if (!confirm(`Are you sure you want to remove ${memberEmail} from this team?`)) return;

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeam.id, memberToRemove: memberEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member");

      onTeamUpdate({ ...selectedTeam, members: data.members });
    } catch (err) {
      alert(err.message);
    }
  };

  // Leave Team
  const handleLeaveTeam = async () => {
    if (!selectedTeam) return;
    setIsLeavingTeam(true);

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeam.id, leave: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to leave team");

      setShowLeaveConfirm(false);
      onLeaveTeam(selectedTeam.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLeavingTeam(false);
    }
  };

  // Helper checking if user is owner of selected team
  const isTeamOwner = selectedTeam?.owner === currentUser?.email;

  // Initials logic
  const getInitials = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[550px] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
      
      {/* ── SETTINGS SIDEBAR ── */}
      <aside className="w-full md:w-60 bg-zinc-950 border-r border-zinc-850/50 p-4 shrink-0 space-y-1">
        <div className="px-3 py-2">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-zinc-550">Settings Areas</h4>
        </div>
        <button
          onClick={() => setActiveSubTab("profile")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            activeSubTab === "profile" 
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <User size={15} />
          <span>My Profile</span>
        </button>
        <button
          onClick={() => setActiveSubTab("security")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            activeSubTab === "security" 
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <Shield size={15} />
          <span>Account & Security</span>
        </button>
        <button
          onClick={() => setActiveSubTab("notifications")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            activeSubTab === "notifications" 
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <Bell size={15} />
          <span>Notifications</span>
        </button>
        <button
          onClick={() => setActiveSubTab("appearance")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            activeSubTab === "appearance" 
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <Palette size={15} />
          <span>Appearance</span>
        </button>
        
        {selectedTeam && (
          <button
            onClick={() => setActiveSubTab("team")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeSubTab === "team" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            <Users size={15} />
            <span>Workspace / Team</span>
          </button>
        )}
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        
        {/* ── PROFILE TAB ── */}
        {activeSubTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-base font-bold text-white">Profile Details</h3>
              <p className="text-xs text-zinc-400">Manage your profile photo, display name, and current status</p>
            </div>

            {/* Profile Picture Upload Section */}
            <div className="flex items-center gap-5 bg-zinc-950 p-4 rounded-2xl border border-zinc-850">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-600/20 border-2 border-indigo-500/50 flex items-center justify-center text-xl font-bold text-indigo-300">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(displayName)
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity cursor-pointer"
                >
                  <Camera size={18} className="text-white" />
                </button>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white">Profile Photo</h4>
                <p className="text-[11px] text-zinc-550 mb-2">Recommended JPG or PNG. Max size 2MB.</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleProfilePictureChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-800 transition-all cursor-pointer"
                >
                  Upload Photo
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-450 uppercase tracking-wider mb-2">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-zinc-650 outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-450 uppercase tracking-wider mb-2">Bio / Current Status</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-zinc-650 outline-none transition-all"
                  placeholder="e.g. Working from home today"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
              >
                {isSavingProfile && <Loader size={13} className="animate-spin" />}
                <span>Save Changes</span>
              </button>

              {profileSuccess && (
                <div className="text-emerald-400 text-xs font-semibold flex items-center gap-1 animate-in fade-in">
                  <CheckCircle size={14} />
                  <span>Profile updated successfully!</span>
                </div>
              )}
            </div>
          </form>
        )}

        {/* ── SECURITY TAB ── */}
        {activeSubTab === "security" && (
          <div className="space-y-8 max-w-xl">
            {/* Password Update Form */}
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Security Settings</h3>
                <p className="text-xs text-zinc-400">Keep your account safe by updating your password regularly</p>
              </div>

              {passwordError && (
                <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-xl text-emerald-300 text-xs flex items-center gap-1.5">
                  <CheckCircle size={14} />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-450 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email || ""}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-zinc-550 cursor-not-allowed outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-450 uppercase tracking-wider mb-2">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-zinc-650 outline-none transition-all"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-450 uppercase tracking-wider mb-2">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-zinc-650 outline-none transition-all"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-450 uppercase tracking-wider mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-zinc-650 outline-none transition-all"
                    placeholder="Verify new password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {isChangingPassword && <Loader size={13} className="animate-spin" />}
                  <span>Change Password</span>
                </button>
              </div>
            </form>

            <div className="h-px bg-zinc-800"></div>

            {/* Dangerous Zone */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500">Danger Zone</h4>
                <p className="text-[11px] text-zinc-450">Irreversible account actions</p>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete My Account</span>
                </button>
              ) : (
                <div className="bg-rose-950/20 border border-rose-800/40 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex gap-2">
                    <AlertTriangle className="text-rose-400 shrink-0" size={18} />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-rose-300">Are you absolutely sure?</h4>
                      <p className="text-[11px] text-rose-200/70 leading-relaxed">
                        This action will delete your account permanently. All teams you own and your profile statistics will be deleted.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-[11px] text-rose-300/80 font-medium">
                      To confirm, type <span className="font-mono bg-rose-950/60 px-1 py-0.5 rounded border border-rose-800/40 font-bold text-rose-200">DELETE PERMANENTLY</span> below:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full max-w-xs px-3.5 py-2.5 bg-zinc-950 border border-rose-800/30 focus:border-rose-500 rounded-xl text-xs text-white placeholder-zinc-700 outline-none font-semibold transition-all"
                      placeholder="DELETE PERMANENTLY"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount || deleteConfirmText !== "DELETE PERMANENTLY"}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isDeletingAccount && <Loader size={13} className="animate-spin" />}
                      <span>Delete Account Permanently</span>
                    </button>
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-850 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {activeSubTab === "notifications" && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-base font-bold text-white">Notification Preferences</h3>
              <p className="text-xs text-zinc-400">Choose when you want to receive alerts and email digests</p>
            </div>

            {notifSuccess && (
              <div className="text-emerald-400 text-xs font-semibold flex items-center gap-1 animate-in fade-in">
                <CheckCircle size={14} />
                <span>Notification preferences saved automatically.</span>
              </div>
            )}

            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-850">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Tasks assigned to me</h4>
                  <p className="text-[10px] text-zinc-500">Receive alerts when a team member assigns a task to you</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification("taskAssigned")}
                  className={`w-10 h-6 rounded-full p-1 transition-all flex items-center cursor-pointer ${
                    notifications.taskAssigned ? "bg-indigo-600 justify-end" : "bg-zinc-800 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-850">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Meeting reminders</h4>
                  <p className="text-[10px] text-zinc-500">Alerts for upcoming meetings and invitations</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification("meetingReminders")}
                  className={`w-10 h-6 rounded-full p-1 transition-all flex items-center cursor-pointer ${
                    notifications.meetingReminders ? "bg-indigo-600 justify-end" : "bg-zinc-800 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-850">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">New chat messages</h4>
                  <p className="text-[10px] text-zinc-500">Get alerts for new messages in team channels</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification("chatMessages")}
                  className={`w-10 h-6 rounded-full p-1 transition-all flex items-center cursor-pointer ${
                    notifications.chatMessages ? "bg-indigo-600 justify-end" : "bg-zinc-800 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-850">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Document uploads</h4>
                  <p className="text-[10px] text-zinc-500">Get notified when team members share documents</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification("documentUploads")}
                  className={`w-10 h-6 rounded-full p-1 transition-all flex items-center cursor-pointer ${
                    notifications.documentUploads ? "bg-indigo-600 justify-end" : "bg-zinc-800 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-850">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Voice notes</h4>
                  <p className="text-[10px] text-zinc-500">Alerts when new voice notes are recorded</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification("voiceNotes")}
                  className={`w-10 h-6 rounded-full p-1 transition-all flex items-center cursor-pointer ${
                    notifications.voiceNotes ? "bg-indigo-600 justify-end" : "bg-zinc-800 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-850">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Desktop Notifications</h4>
                  <p className="text-[10px] text-zinc-500">Show alerts directly on your screen</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification("desktopNotifications")}
                  className={`w-10 h-6 rounded-full p-1 transition-all flex items-center cursor-pointer ${
                    notifications.desktopNotifications ? "bg-indigo-600 justify-end" : "bg-zinc-800 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-850">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Email Notifications</h4>
                  <p className="text-[10px] text-zinc-500">Send an email digest of important dashboard updates</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification("emailNotifications")}
                  className={`w-10 h-6 rounded-full p-1 transition-all flex items-center cursor-pointer ${
                    notifications.emailNotifications ? "bg-indigo-600 justify-end" : "bg-zinc-800 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── APPEARANCE TAB ── */}
        {activeSubTab === "appearance" && (
          <div className="space-y-6 max-w-xl animate-in fade-in">
            <div>
              <h3 className="text-base font-bold text-white">Appearance & Theme</h3>
              <p className="text-xs text-zinc-400">Select your preferred user interface color scheme</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              
              {/* Dark Theme Select */}
              <button
                type="button"
                onClick={() => toggleTheme("dark")}
                className={`p-5 rounded-2xl border text-left cursor-pointer transition-all ${
                  theme === "dark" 
                    ? "bg-zinc-950 border-indigo-500 text-white ring-1 ring-indigo-500" 
                    : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="w-full h-20 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 mb-3 space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <span className="w-10 h-1.5 bg-zinc-850 rounded"></span>
                  </div>
                  <span className="w-16 h-2 bg-zinc-800 rounded"></span>
                  <div className="flex gap-1">
                    <span className="w-3 h-3 rounded-full bg-zinc-750"></span>
                    <span className="w-3 h-3 rounded-full bg-zinc-750"></span>
                  </div>
                </div>
                <span className="text-xs font-bold block mb-0.5">Dark Mode</span>
                <span className="text-[10px] text-zinc-500">Elegant layout styled for low light environments</span>
              </button>

              {/* Light Theme Select */}
              <button
                type="button"
                onClick={() => toggleTheme("light")}
                className={`p-5 rounded-2xl border text-left cursor-pointer transition-all ${
                  theme === "light" 
                    ? "bg-white border-indigo-500 text-zinc-900 ring-1 ring-indigo-500" 
                    : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="w-full h-20 bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-3 space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <span className="w-10 h-1.5 bg-slate-200 rounded"></span>
                  </div>
                  <span className="w-16 h-2 bg-slate-100 rounded"></span>
                  <div className="flex gap-1">
                    <span className="w-3 h-3 rounded-full bg-slate-200"></span>
                    <span className="w-3 h-3 rounded-full bg-slate-200"></span>
                  </div>
                </div>
                <span className="text-xs font-bold block mb-0.5">Light Mode</span>
                <span className="text-[10px] text-zinc-500">Clean, bright user interface themed with slate hues</span>
              </button>

            </div>
          </div>
        )}

        {/* ── TEAM TAB ── */}
        {activeSubTab === "team" && selectedTeam && (
          <div className="space-y-8 max-w-xl">
            {/* Team details & Rename Form */}
            <form onSubmit={handleUpdateTeamName} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Team & Workspace Settings</h3>
                <p className="text-xs text-zinc-400">View team members and manage this team details</p>
              </div>

              {teamError && (
                <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>{teamError}</span>
                </div>
              )}

              {teamSuccess && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-xl text-emerald-300 text-xs flex items-center gap-1.5">
                  <CheckCircle size={14} />
                  <span>Team name updated successfully!</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-450 uppercase tracking-wider mb-2">Team Name</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      disabled={!isTeamOwner}
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className={`flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm outline-none transition-all ${
                        isTeamOwner ? "focus:border-indigo-500 text-white" : "text-zinc-500 cursor-not-allowed"
                      }`}
                      placeholder="e.g. Development Team"
                    />
                    
                    {isTeamOwner && (
                      <button
                        type="submit"
                        disabled={isSavingTeamName || teamName.trim() === selectedTeam.name}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-850 disabled:text-zinc-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        {isSavingTeamName && <Loader size={12} className="animate-spin" />}
                        <span>Rename</span>
                      </button>
                    )}
                  </div>
                  {!isTeamOwner && (
                    <span className="text-[10px] text-zinc-550 mt-1 block">Only the team owner ({selectedTeam.owner}) can change the team name.</span>
                  )}
                </div>
              </div>
            </form>

            <div className="h-px bg-zinc-800"></div>

            {/* Team Members List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Team Members</h4>
                <span className="px-2 py-0.5 text-xs bg-zinc-950 text-zinc-400 rounded-full font-semibold border border-zinc-850">
                  {selectedTeam.members?.length || 0} Members
                </span>
              </div>

              <div className="space-y-2">
                {selectedTeam.members?.map((email) => {
                  const isOwner = email === selectedTeam.owner;
                  const isMe = email === currentUser?.email;

                  return (
                    <div 
                      key={email}
                      className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-zinc-805 border border-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0">
                          {email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-200 truncate">
                            {email} {isMe ? "(You)" : ""}
                          </p>
                          {isOwner && (
                            <span className="text-[9px] text-indigo-400 font-bold uppercase">Team Owner</span>
                          )}
                        </div>
                      </div>

                      {/* Remove Button for Owner (only on other members) */}
                      {isTeamOwner && !isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(email)}
                          className="p-1.5 hover:bg-rose-950/20 text-zinc-450 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                          title="Remove Member"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leave Team Option (Non-Owners) */}
            {!isTeamOwner && (
              <div className="pt-2">
                <div className="h-px bg-zinc-800 mb-6"></div>
                {!showLeaveConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowLeaveConfirm(true)}
                    className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Leave Team</span>
                  </button>
                ) : (
                  <div className="bg-rose-950/20 border border-rose-800/40 p-4 rounded-xl space-y-4 animate-in fade-in">
                    <div className="flex gap-2">
                      <AlertTriangle className="text-rose-400 shrink-0" size={16} />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-rose-300">Leave Team?</h4>
                        <p className="text-[11px] text-rose-200/70">
                          Are you sure you want to leave {selectedTeam.name}? You will lose access to team chat, documents, tasks, and meetings.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleLeaveTeam}
                        disabled={isLeavingTeam}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        {isLeavingTeam && <Loader size={12} className="animate-spin" />}
                        <span>Confirm Leave</span>
                      </button>
                      <button
                        onClick={() => setShowLeaveConfirm(false)}
                        className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-850 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
}
