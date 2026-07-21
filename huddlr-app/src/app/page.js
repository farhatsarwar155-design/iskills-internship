import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden flex flex-col justify-between">
      {/* Decorative background glow circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <span className="text-xl font-black text-white">H</span>
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            Huddlr
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-semibold text-zinc-400 hover:text-white transition-all"
          >
            Sign In
          </Link>
          <Link 
            href="/register" 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/10 hover:scale-[1.02] active:scale-[1]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 text-center py-20 md:py-32 relative z-10 space-y-8 flex-1 flex flex-col justify-center">
        <div className="space-y-4">
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wider">
            Now in public beta
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Collaborate. Chat. <br />
            Build. Together.
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto font-medium">
            Huddlr is a premium, real-time workspace for fast-moving teams. Real-time channels, task management, shared documents, and meetings — all unified in one place.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/register" 
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 text-center"
          >
            Create Free Account
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl font-bold text-sm transition-all text-center"
          >
            Sign In to Workspace
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 text-left">
          {[
            { title: "Real-time Team Chat", desc: "Instantly chat with your teams inside persistent Firestore-backed channels." },
            { title: "OTP-Secure Accounts", desc: "Sign up and verify instantly via 6-digit OTP delivery, protected by JWT sessions." },
            { title: "Unified Collaboration", desc: "Organize tasks, schedule instant video meetings, and store shared documents." }
          ].map((feat, i) => (
            <div key={i} className="p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-850 rounded-2xl space-y-2 hover:border-zinc-700 transition-all">
              <h3 className="font-bold text-white text-base">{feat.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-zinc-900 flex items-center justify-center text-xs text-zinc-650 relative z-10">
        &copy; {new Date().getFullYear()} Huddlr Inc. All rights reserved.
      </footer>
    </div>
  );
}
