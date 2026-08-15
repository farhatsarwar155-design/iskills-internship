'use client';

import React from 'react';
import FadeIn from './FadeIn';
import { Sparkles, BrainCircuit, LineChart, Bot } from 'lucide-react';

function ActivityIcon(props: any) {
  return <BrainCircuit {...props} />;
}

const aiFeatures = [
  {
    title: 'Business Health Score',
    description: 'Our proprietary algorithm analyzes your cash flow, sales trends, and employee retention to generate a daily health grade.',
    icon: ActivityIcon,
  },
  {
    title: 'Predictive Stockouts',
    description: 'Machine learning models predict exactly when you will run out of inventory based on historical sales velocity.',
    icon: LineChart,
  },
  {
    title: 'AI Assistant',
    description: 'Chat naturally with your ERP. Ask "What were our top sales last week?" or "Do we need to reorder laptops?" and get instant answers.',
    icon: Bot,
  }
];

export default function AIHighlight() {
  return (
    <section id="ai" className="relative py-24 bg-indigo-950 overflow-hidden">
      {/* Background FX */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-fuchsia-500/20 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Built-in Machine Learning
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Work smarter with AI
            </h2>
            <p className="mt-4 text-indigo-200 font-medium text-lg">
              Bizloom doesn't just store your data — it understands it. 
              Our embedded AI acts as your virtual Chief Operating Officer.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {aiFeatures.map((feature, idx) => (
            <FadeIn key={idx} delay={idx * 100}>
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors h-full">
                <div className="inline-flex p-3 rounded-xl bg-indigo-500/20 text-indigo-300 mb-6">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-indigo-200/80 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
