'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Trash2, CheckCircle2, Circle, Clock, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  category: 'Sales' | 'Inventory' | 'HR' | 'Finance' | 'General';
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  dueDate: string;
}

const DEFAULT_TASKS: Task[] = [
  { id: '1', title: 'Review low-stock products & issue purchase order for Keyboards', category: 'Inventory', priority: 'High', completed: false, dueDate: 'Today' },
  { id: '2', title: 'Follow up on overdue invoice #ORD-2026-102 with customer', category: 'Sales', priority: 'High', completed: false, dueDate: 'Today' },
  { id: '3', title: 'Approve pending leave request for Sarah Manager', category: 'HR', priority: 'Medium', completed: true, dueDate: 'Yesterday' },
  { id: '4', title: 'Reconcile monthly tax transactions for Q1 report', category: 'Finance', priority: 'Medium', completed: false, dueDate: 'Tomorrow' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Task['category']>('General');
  const [newPriority, setNewPriority] = useState<Task['priority']>('Medium');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bizloom_tasks');
      if (stored) setTasks(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    try {
      localStorage.setItem('bizloom_tasks', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      completed: false,
      dueDate: 'Today',
    };

    saveTasks([newTask, ...tasks]);
    setNewTitle('');
    toast.success('Task created');
  };

  const toggleTask = (id: string) => {
    saveTasks(tasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
    toast.success('Task deleted');
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              Tasks & Reminders
            </h1>
            <span className="flex h-6 items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wider">
              <CheckSquare className="h-3 w-3" />
              To-Do List
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-semibold">
            Internal task tracking and operational follow-ups across ERP departments.
          </p>
        </div>

        {/* Task Counter Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3.5 py-1.5 rounded-xl shadow-xs text-xs font-bold text-neutral-700 dark:text-neutral-300">
            Pending: <span className="text-indigo-600 dark:text-indigo-400 font-black">{pendingCount}</span> · Completed: <span className="text-emerald-600 dark:text-emerald-400 font-black">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="What needs to be done? Enter task details..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="flex-1 h-10 px-3.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as any)}
              className="h-10 text-xs px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 font-bold"
            >
              <option value="General">General</option>
              <option value="Inventory">Inventory</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
            </select>
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value as any)}
              className="h-10 text-xs px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 font-bold"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
            <Button type="submit" className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shrink-0">
              <Plus className="h-4 w-4" /> Add Task
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm">
        <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50">
          <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Tasks List</CardTitle>
          <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">Manage internal operational reminders.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">All tasks clear! Add a new task above.</div>
          ) : (
            tasks.map(task => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  task.completed
                    ? 'bg-slate-50/30 dark:bg-neutral-950/20 border-neutral-100 dark:border-neutral-850 opacity-60'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200/60 dark:border-neutral-800 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => toggleTask(task.id)} className="text-neutral-400 hover:text-indigo-500 transition-colors shrink-0">
                    {task.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <div className="min-w-0">
                    <span className={`text-xs font-bold block truncate ${task.completed ? 'line-through text-neutral-400 dark:text-neutral-600' : 'text-neutral-800 dark:text-neutral-200'}`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        {task.category}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        task.priority === 'High' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {task.priority} Priority
                      </span>
                    </div>
                  </div>
                </div>

                <button onClick={() => deleteTask(task.id)} className="p-1.5 text-neutral-300 hover:text-rose-500 transition-colors shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
