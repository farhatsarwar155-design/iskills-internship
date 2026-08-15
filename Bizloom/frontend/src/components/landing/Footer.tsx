'use client';

import React from 'react';
import Link from 'next/link';
import { Hexagon, Globe, Share2, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-neutral-950 pt-20 pb-10 border-t border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                <Hexagon className="h-4 w-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-neutral-900 dark:text-white">
                Bizloom
              </span>
            </Link>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
              The all-in-one, AI-powered ERP platform for growing modern businesses.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-neutral-400 hover:text-indigo-600 transition-colors" title="Twitter">
                <Share2 className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-indigo-600 transition-colors" title="LinkedIn">
                <Globe className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-indigo-600 transition-colors" title="GitHub">
                <Code2 className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-neutral-900 dark:text-white mb-6 uppercase tracking-wider text-xs">Product</h4>
            <ul className="space-y-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              <li><a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a></li>
              <li><a href="#modules" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Modules</a></li>
              <li><a href="#ai" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">AI Intelligence</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-neutral-900 dark:text-white mb-6 uppercase tracking-wider text-xs">Company</h4>
            <ul className="space-y-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Partners</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-neutral-900 dark:text-white mb-6 uppercase tracking-wider text-xs">Resources</h4>
            <ul className="space-y-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Documentation</a></li>
              <li><a href="http://localhost:5000/api-docs" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">API Docs (Swagger)</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Status</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            © {new Date().getFullYear()} Bizloom ERP. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
