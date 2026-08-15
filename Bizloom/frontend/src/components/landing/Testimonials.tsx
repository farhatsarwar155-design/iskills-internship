'use client';

import React from 'react';
import FadeIn from './FadeIn';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const testimonials = [
  {
    quote: "Bizloom replaced our four separate tools for HR, inventory, CRM, and accounting. The AI insights alone have saved us thousands by preventing overstocking.",
    name: "Sarah Chen",
    role: "Operations Director",
    company: "TechNova Solutions",
    initials: "SC",
    color: "bg-indigo-100 text-indigo-700"
  },
  {
    quote: "The interface is incredible. My team didn't need any training to start using the system, and the automated purchase orders are a game-changer.",
    name: "Marcus Johnson",
    role: "Founder",
    company: "Urban Retail Co.",
    initials: "MJ",
    color: "bg-emerald-100 text-emerald-700"
  },
  {
    quote: "Having real-time access to our business health score gives me peace of mind. It's like having a financial analyst on duty 24/7.",
    name: "Elena Rodriguez",
    role: "CEO",
    company: "Apex Manufacturing",
    initials: "ER",
    color: "bg-rose-100 text-rose-700"
  }
];

export default function Testimonials() {
  return (
    <section id="about" className="py-24 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
              Loved by growing businesses
            </h2>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test, idx) => (
            <FadeIn key={idx} delay={idx * 100}>
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 h-full flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300 font-medium leading-relaxed mb-8">
                    "{test.quote}"
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border border-neutral-200 dark:border-neutral-700">
                    <AvatarFallback className={`font-bold text-xs ${test.color}`}>
                      {test.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{test.name}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{test.role}, {test.company}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
