"use client";

import { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, UserX, UserCheck, X, Crown, Loader, AlertTriangle } from "lucide-react";

export default function ManageTeamModal({ selectedTeam, currentUser, onClose, onTeamUpdate }) {
  const [loadingMember, setLoadingMember] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState(null);

  if (!selectedTeam || !currentUser) return null;

  // Determine current user's role in the selected team
  const memberRoles = selectedTeam.memberRoles || {};
  const currentMemberRole = memberRoles[currentUser.email] || (selectedTeam.owner === currentUser.email ? "owner" : "member");

  const isOwner = currentMemberRole === "owner";
  const isCoLead = currentMemberRole === "co-lead";

  const handleRoleChange = async (targetEmail, newRole) => {
    setLoadingMember(targetEmail);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          changeMemberRole: {
            targetEmail,
            newRole
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update member role");
      }

      onTeamUpdate({
        ...selectedTeam,
        memberRoles: data.memberRoles
      });

      setSuccessMsg(`Updated ${targetEmail} role to ${newRole === "co-lead" ? "Co-Lead" : "Member"}`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingMember(null);
    }
  };

  const handleRemoveMember = async (targetEmail) => {
    setLoadingMember(targetEmail);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          memberToRemove: targetEmail
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove member");
      }

      onTeamUpdate({
        ...selectedTeam,
        members: data.members,
        memberRoles: data.memberRoles
      });

      setSuccessMsg(`Removed ${targetEmail} from team`);
      setConfirmAction(null);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingMember(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manage Team: {selectedTeam.name}</h3>
              <p className="text-xs text-zinc-400">
                You are managing this team as <span className="text-indigo-400 font-semibold uppercase">{currentMemberRole}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
            <ShieldCheck size={15} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Member List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Team Members ({selectedTeam.members?.length || 0})</h4>
          
          {selectedTeam.members?.map((email) => {
            const role = memberRoles[email] || (selectedTeam.owner === email ? "owner" : "member");
            const isMe = email === currentUser.email;

            // Permissions logic
            const canRemove = !isMe && role !== "owner" && (isOwner || (isCoLead && role === "member"));
            const canPromote = isOwner && role === "member";
            const canDemote = isOwner && role === "co-lead";

            return (
              <div
                key={email}
                className="flex items-center justify-between p-4 bg-zinc-950/60 border border-zinc-850 hover:border-zinc-800 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{email}</span>
                      {isMe && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">(You)</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {role === "owner" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                          <Crown size={11} /> Owner
                        </span>
                      )}
                      {role === "co-lead" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded-full">
                          <ShieldCheck size={11} /> Co-Lead
                        </span>
                      )}
                      {role === "member" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-800/50 border border-zinc-700/30 px-2 py-0.5 rounded-full">
                          Member
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {loadingMember === email ? (
                    <Loader size={16} className="animate-spin text-indigo-400" />
                  ) : (
                    <>
                      {/* Promote to Co-Lead */}
                      {canPromote && (
                        <button
                          onClick={() => handleRoleChange(email, "co-lead")}
                          title="Promote to Co-Lead"
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <ShieldCheck size={13} />
                          <span>Make Co-Lead</span>
                        </button>
                      )}

                      {/* Demote to Member */}
                      {canDemote && (
                        <button
                          onClick={() => handleRoleChange(email, "member")}
                          title="Demote to Member"
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-750 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>Demote to Member</span>
                        </button>
                      )}

                      {/* Remove Member */}
                      {canRemove && (
                        <button
                          onClick={() => setConfirmAction({ type: "remove", email })}
                          title="Remove Member"
                          className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/40 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <UserX size={13} />
                          <span>Remove</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle size={24} />
              <h4 className="text-base font-bold text-white">Remove Team Member?</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to remove <span className="text-white font-semibold">{confirmAction.email}</span> from this team? They will lose access to team chat, meetings, and documents.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveMember(confirmAction.email)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
