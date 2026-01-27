import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Info, Terminal } from 'lucide-react';

const StatCard = ({ title, value, trend, status }) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm my-3 w-full max-w-sm hover:scale-[1.02] transition-transform">
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
      {status === 'active' && <Activity size={16} className="text-blue-500 animate-pulse" />}
      {status === 'success' && <CheckCircle size={16} className="text-green-500" />}
      {status === 'warning' && <AlertTriangle size={16} className="text-yellow-500" />}
    </div>
    <div className="text-3xl font-black text-slate-900 dark:text-white">{value}</div>
    {trend && <div className="text-xs font-medium text-green-600 mt-1">{trend}</div>}
  </div>
);

const AlertBox = ({ type, message }) => {
  const styles = {
    info: "bg-blue-50 text-blue-700 border-blue-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    error: "bg-red-50 text-red-700 border-red-200"
  };
  return (
    <div className={`p-3 rounded-lg border flex items-start gap-3 my-2 text-sm ${styles[type] || styles.info}`}>
      <Info size={18} className="shrink-0 mt-0.5" />
      <span className="font-medium">{message}</span>
    </div>
  );
};

const CodeBlock = ({ lang, code }) => (
  <div className="bg-slate-950 rounded-lg overflow-hidden my-3 border border-slate-800 w-full shadow-md">
    <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center">
        <span className="text-xs text-slate-400 font-mono">{lang || 'code'}</span>
        <Terminal size={12} className="text-slate-500" />
    </div>
    <div className="p-3 overflow-x-auto">
      <pre className="text-sm font-mono text-green-400"><code>{code}</code></pre>
    </div>
  </div>
);

const MessageRenderer = ({ content }) => {
  if (!content) return null;

  // Split text by the secret delimiter |||
  const parts = content.split(/(\|\|\|.*?\|\|\|)/gs);

  return (
    <div className="space-y-2 w-full">
      {parts.map((part, i) => {
        if (part.startsWith('|||') && part.endsWith('|||')) {
          // It's a Widget -> Try to Parse JSON
          try {
            const json = JSON.parse(part.replace(/\|\|\|/g, '').trim());
            
            switch (json.type) {
              case 'stat': return <StatCard key={i} {...json} />;
              case 'alert': return <AlertBox key={i} {...json} />;
              case 'code': return <CodeBlock key={i} {...json} />;
              default: return null;
            }
          } catch (e) { return null; }
        } else {
          // It's Text -> Render standard paragraph
          return <p key={i} className="whitespace-pre-wrap leading-relaxed">{part}</p>;
        }
      })}
    </div>
  );
};

export default MessageRenderer;