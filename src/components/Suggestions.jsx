import React from 'react';

const Suggestions = ({ suggestions, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion.prompt)}
          className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 mt-0.5 text-xl">
              {suggestion.icon || 'lightbulb'}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                {suggestion.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                "{suggestion.prompt}"
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default Suggestions;