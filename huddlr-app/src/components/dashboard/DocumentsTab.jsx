"use client";

import { useState, useEffect, useRef } from "react";
import { db, collection, query, where, onSnapshot, addDoc } from "@/lib/firebase";
import { Upload, FileText, Image, File, Download, FolderPlus, Folder, Trash2, Eye, Loader, X } from "lucide-react";

const FILE_ICONS = {
  "application/pdf": { icon: FileText, color: "text-rose-400", label: "PDF", bg: "bg-rose-500/10" },
  "image/png": { icon: Image, color: "text-emerald-400", label: "PNG", bg: "bg-emerald-500/10" },
  "image/jpeg": { icon: Image, color: "text-emerald-400", label: "JPG", bg: "bg-emerald-500/10" },
  "image/gif": { icon: Image, color: "text-emerald-400", label: "GIF", bg: "bg-emerald-500/10" },
  "image/webp": { icon: Image, color: "text-emerald-400", label: "IMG", bg: "bg-emerald-500/10" },
  "application/msword": { icon: FileText, color: "text-blue-400", label: "DOC", bg: "bg-blue-500/10" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { icon: FileText, color: "text-blue-400", label: "DOCX", bg: "bg-blue-500/10" },
  "text/plain": { icon: FileText, color: "text-zinc-400", label: "TXT", bg: "bg-zinc-500/10" },
  "default": { icon: File, color: "text-indigo-400", label: "FILE", bg: "bg-indigo-500/10" }
};

const getFileIcon = (type) => FILE_ICONS[type] || FILE_ICONS["default"];

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentsTab({ selectedTeam, currentUser }) {
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch documents
  useEffect(() => {
    if (!selectedTeam) return;

    const docsRef = collection(db, "documents");
    const q = query(docsRef, where("teamId", "==", selectedTeam.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (!data.deleted) docs.push({ id: docSnap.id, ...data });
      });
      docs.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
      setDocuments(docs);
    });

    return () => unsubscribe();
  }, [selectedTeam]);

  // Fetch folders
  useEffect(() => {
    if (!selectedTeam) return;

    const foldersRef = collection(db, "folders");
    const q = query(foldersRef, where("teamId", "==", selectedTeam.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const folderList = [];
      snapshot.forEach(docSnap => {
        folderList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setFolders(folderList);
    });

    return () => unsubscribe();
  }, [selectedTeam]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedTeam) return;

    setIsUploading(true);
    for (const file of files) {
      setUploadProgress(`Uploading ${file.name}...`);
      try {
        // Convert file to base64 for mock storage
        await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (evt) => {
            try {
              await addDoc(collection(db, "documents"), {
                teamId: selectedTeam.id,
                folderId: selectedFolder || null,
                name: file.name,
                type: file.type,
                size: file.size,
                fileData: evt.target.result, // base64 data URL
                uploaderEmail: currentUser.email,
                uploaderName: currentUser.name || currentUser.email,
                uploadedAt: Date.now(),
                deleted: false,
              });

              // Create notification for other team members
              if (selectedTeam.members) {
                for (const member of selectedTeam.members) {
                  if (member !== currentUser.email) {
                    await addDoc(collection(db, "notifications"), {
                      userEmail: member,
                      type: "document",
                      title: "New Document Shared",
                      message: `${currentUser.name || currentUser.email} uploaded "${file.name}" in team ${selectedTeam.name}.`,
                      read: false,
                      timestamp: Date.now(),
                      linkId: selectedTeam.id
                    }).catch(err => console.error(err));
                  }
                }
              }
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }
    setIsUploading(false);
    setUploadProgress(null);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim() || !selectedTeam) return;
    try {
      await addDoc(collection(db, "folders"), {
        teamId: selectedTeam.id,
        name: newFolderName.trim(),
        createdBy: currentUser.email,
        createdAt: Date.now(),
      });
      setNewFolderName("");
      setShowFolderModal(false);
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  };

  const handleDownload = (doc) => {
    if (!doc.fileData) return;
    const link = document.createElement("a");
    link.href = doc.fileData;
    link.download = doc.name;
    link.click();
  };

  const visibleDocs = documents.filter(d => 
    selectedFolder ? d.folderId === selectedFolder : true
  );

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Documents</h3>
          <p className="text-sm text-zinc-400">Files shared in {selectedTeam?.name}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFolderModal(true)}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all"
          >
            <FolderPlus size={15} /> New Folder
          </button>
          <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all">
            <Upload size={15} /> Upload Files
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="*/*"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-4 p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl flex items-center gap-3 text-indigo-300 text-sm">
          <Loader size={16} className="animate-spin shrink-0" />
          {uploadProgress || "Uploading..."}
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar: Folders */}
        <div className="w-48 shrink-0">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Folders
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${!selectedFolder ? "bg-indigo-600/20 text-indigo-300" : "text-zinc-400 hover:bg-zinc-800"}`}
              >
                <Folder size={14} /> All Files
              </button>
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${selectedFolder === folder.id ? "bg-indigo-600/20 text-indigo-300" : "text-zinc-400 hover:bg-zinc-800"}`}
                >
                  <Folder size={14} /> {folder.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Document Grid */}
        <div className="flex-1 overflow-y-auto">
          {visibleDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
              <File size={48} className="opacity-20" />
              <p className="text-sm">No documents yet.</p>
              <label className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer">
                <Upload size={14} /> Upload First File
                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleDocs.map(docItem => {
                const fileIconData = getFileIcon(docItem.type);
                const IconComp = fileIconData.icon;
                const isImage = docItem.type?.startsWith("image/");

                return (
                  <div
                    key={docItem.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group"
                  >
                    {/* Preview area */}
                    <div className={`h-32 flex items-center justify-center relative ${isImage ? "bg-zinc-950" : fileIconData.bg + " bg-opacity-50"}`}>
                      {isImage && docItem.fileData ? (
                        <img
                          src={docItem.fileData}
                          alt={docItem.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <IconComp size={40} className={fileIconData.color} />
                          <span className={`text-xs font-bold ${fileIconData.color}`}>{fileIconData.label}</span>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {docItem.fileData && (
                          <button
                            onClick={() => setPreviewDoc(docItem)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white cursor-pointer"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(docItem)}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white cursor-pointer"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>

                    {/* File info */}
                    <div className="p-3">
                      <p className="text-sm font-semibold text-zinc-200 truncate">{docItem.name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-zinc-500 truncate">{docItem.uploaderName}</p>
                        <p className="text-xs text-zinc-600 font-mono">{formatBytes(docItem.size || 0)}</p>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {new Date(docItem.uploadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FolderPlus size={18} className="text-indigo-400" /> Create Folder
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                required
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 outline-none rounded-xl text-sm text-white"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-sm cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm cursor-pointer">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewDoc(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewDoc(null)}
              className="absolute -top-10 right-0 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X size={24} />
            </button>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <p className="font-semibold text-white truncate">{previewDoc.name}</p>
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Download size={13} /> Download
                </button>
              </div>
              <div className="p-4 max-h-[70vh] overflow-auto flex items-center justify-center bg-zinc-950">
                {previewDoc.type?.startsWith("image/") ? (
                  <img src={previewDoc.fileData} alt={previewDoc.name} className="max-w-full max-h-[60vh] object-contain" />
                ) : previewDoc.type === "application/pdf" ? (
                  <iframe src={previewDoc.fileData} className="w-full h-[60vh]" title={previewDoc.name} />
                ) : (
                  <div className="text-center text-zinc-500 py-12">
                    <File size={48} className="mx-auto mb-3 opacity-30" />
                    <p>Preview not available for this file type.</p>
                    <button onClick={() => handleDownload(previewDoc)} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm cursor-pointer">
                      Download to view
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
