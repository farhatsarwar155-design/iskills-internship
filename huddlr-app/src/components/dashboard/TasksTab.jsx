"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { db, collection, query, where, onSnapshot, addDoc, doc, updateDoc } from "@/lib/firebase";
import { Clock, Plus, CheckSquare } from "lucide-react";

const COLUMNS = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" }
];

export default function TasksTab({ selectedTeam, currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");

  // Fetch tasks
  useEffect(() => {
    if (!selectedTeam) return;

    const tasksRef = collection(db, "tasks");
    const q = query(tasksRef, where("teamId", "==", selectedTeam.id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = [];
      snapshot.forEach(docSnap => {
        fetchedTasks.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort by creation time so they don't jump around randomly
      fetchedTasks.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setTasks(fetchedTasks);
    });

    return () => unsubscribe();
  }, [selectedTeam]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    // Optimistic UI update
    const newStatus = destination.droppableId;
    setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));

    // Update in Firestore
    try {
      const taskRef = doc(db, "tasks", draggableId);
      await updateDoc(taskRef, { status: newStatus });
    } catch (err) {
      console.error("Failed to update task status", err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim() || !selectedTeam) return;

    try {
      const taskData = {
        teamId: selectedTeam.id,
        title,
        description,
        assigneeEmail,
        dueDate,
        priority,
        status: "todo",
        createdAt: Date.now(),
        createdBy: currentUser.email
      };

      await addDoc(collection(db, "tasks"), taskData);

      // Create a notification for the assignee if it's someone else
      if (assigneeEmail && assigneeEmail !== currentUser.email) {
        await addDoc(collection(db, "notifications"), {
          userEmail: assigneeEmail,
          type: "task",
          title: "New Task Assigned",
          message: `${currentUser.name || currentUser.email} assigned you: "${title}" in team ${selectedTeam.name}.`,
          read: false,
          timestamp: Date.now(),
          linkId: selectedTeam.id
        });
        
        // Send email notification
        fetch("/api/notifications/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: assigneeEmail,
            subject: `New Task: ${title}`,
            html: `<p><b>${currentUser.name || currentUser.email}</b> assigned you a new task in team <b>${selectedTeam.name}</b>:</p><p><i>${title}</i></p><p>Due: ${dueDate}</p>`,
            type: "task"
          })
        }).catch(err => console.error("Failed to trigger task email", err));
      }

      setShowModal(false);
      setTitle("");
      setDescription("");
      setAssigneeEmail("");
      setDueDate("");
      setPriority("medium");
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const priorityColors = {
    low: "bg-emerald-500/20 text-emerald-400",
    medium: "bg-amber-500/20 text-amber-400",
    high: "bg-rose-500/20 text-rose-400"
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Sprint Tasks</h3>
          <p className="text-sm text-zinc-400">Manage action items for {selectedTeam?.name}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          {COLUMNS.map(column => {
            const columnTasks = tasks.filter(t => t.status === column.id);

            return (
              <div key={column.id} className="flex flex-col bg-zinc-900/50 rounded-2xl border border-zinc-800/80 overflow-hidden">
                <div className="p-4 border-b border-zinc-800/80 bg-zinc-900 flex justify-between items-center">
                  <h4 className="font-semibold text-zinc-200">{column.title}</h4>
                  <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-4 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-zinc-800/20' : ''}`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 bg-zinc-950 rounded-xl border ${snapshot.isDragging ? 'border-indigo-500 shadow-xl shadow-indigo-900/20 z-50' : 'border-zinc-800'} transition-shadow cursor-grab active:cursor-grabbing group`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                                  {task.priority}
                                </span>
                                {task.dueDate && (
                                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                    <Clock size={12} /> {task.dueDate}
                                  </div>
                                )}
                              </div>
                              <h5 className="text-sm font-semibold text-white mb-1">{task.title}</h5>
                              {task.description && (
                                <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{task.description}</p>
                              )}
                              
                              {task.assigneeEmail && (
                                <div className="mt-3 flex items-center gap-2 border-t border-zinc-800/50 pt-3">
                                  <div className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-[10px] font-bold text-indigo-200">
                                    {task.assigneeEmail.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-[10px] text-zinc-400 truncate">{task.assigneeEmail}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* CREATE TASK MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-850 rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckSquare size={20} className="text-indigo-400"/> Create Task
            </h3>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design landing page"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm placeholder-zinc-650 outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add some details..."
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm placeholder-zinc-650 outline-none text-white min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Assignee</label>
                  <select
                    value={assigneeEmail}
                    onChange={(e) => setAssigneeEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white"
                  >
                    <option value="">Unassigned</option>
                    {/* The owner should be in the list, plus all members */}
                    {[selectedTeam.owner, ...(selectedTeam.members || [])].filter((v, i, a) => a.indexOf(v) === i).map(email => (
                      <option key={email} value={email}>{email === currentUser.email ? 'Me' : email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white capitalize"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
