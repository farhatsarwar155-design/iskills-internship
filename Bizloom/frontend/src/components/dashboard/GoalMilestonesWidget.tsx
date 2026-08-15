'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Target, Trophy, Edit2, Check, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export interface MilestoneItem {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  isCurrency: boolean;
}

interface GoalMilestonesWidgetProps {
  milestones?: MilestoneItem[];
}

export default function GoalMilestonesWidget({ milestones: initialMilestones = [] }: GoalMilestonesWidgetProps) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<MilestoneItem[]>(initialMilestones);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Keep state synced with props if initialMilestones load later
  React.useEffect(() => {
    if (initialMilestones.length > 0) {
      setMilestones(initialMilestones);
    }
  }, [initialMilestones]);

  const handleEditClick = (m: MilestoneItem) => {
    setEditingId(m.id);
    setEditValue(String(m.target));
  };

  const handleSaveTarget = (id: string) => {
    const val = Number(editValue);
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid positive target number');
      return;
    }

    setMilestones(prev =>
      prev.map(item => (item.id === id ? { ...item, target: val } : item))
    );
    setEditingId(null);
    toast.success('Milestone goal updated!');
  };

  return (
    <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col h-full animate-fade-slide-up" style={{ animationDelay: '0.55s' }}>
      <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-emerald-500" />
            Goal Milestones Tracker
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">
            Progress towards operational targets.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-center">
        {milestones.length === 0 ? (
          <div className="text-center py-6 text-xs text-neutral-400">Loading goal progress...</div>
        ) : (
          milestones.map(m => {
            const pct = Math.min(100, Math.round((m.current / m.target) * 100));
            const isCompleted = pct >= 100;

            const barColor = isCompleted
              ? 'bg-emerald-500'
              : pct >= 60
              ? 'bg-indigo-500'
              : 'bg-amber-500';

            return (
              <div key={m.id} className="space-y-1.5 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 animate-pulse">
                        <Trophy className="h-3 w-3" /> Reached!
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{m.title}</span>
                    )}
                  </div>

                  {/* Target Editor */}
                  {user?.role === 'ADMIN' && (
                    <div>
                      {editingId === m.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="w-20 h-6 text-xs px-1.5 rounded-md border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-bold"
                            autoFocus
                          />
                          <button onClick={() => handleSaveTarget(m.id)} className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-0.5 text-rose-500 hover:bg-rose-50 rounded">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(m)}
                          className="p-1 text-neutral-400 hover:text-indigo-500 transition-colors"
                          title="Edit target goal"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-neutral-900 dark:text-neutral-100">
                    {m.isCurrency ? `$${m.current.toLocaleString()}` : m.current}
                    <span className="text-[11px] font-normal text-neutral-400">
                      {' '}
                      / {m.isCurrency ? `$${m.target.toLocaleString()}` : `${m.target} ${m.unit}`}
                    </span>
                  </span>
                  <span className="text-[11px] font-black text-neutral-500">{pct}%</span>
                </div>

                {/* Progress bar with celebratory animation if complete */}
                <div className="relative h-2 w-full bg-neutral-200/60 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
