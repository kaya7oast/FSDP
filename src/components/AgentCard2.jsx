import React from 'react';

const AgentCard2 = ({ 
  agent, 
  currentUserId, 
  onLike,        
  onAdd, // <--- New Prop for adding to dashboard
  onEdit, 
  isOwner 
}) => {
  const caps = agent?.Capabilities ?? [];
  const lastUpdated = agent?.UpdatedAt 
    ? new Date(agent.UpdatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
    : 'New';

  const isLiked = agent.Likes?.includes(currentUserId);
  const likeCount = agent.Likes?.length || 0;

  const getBadgeStyle = (index) => {
    const styles = [
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    ];
    return styles[index % styles.length];
  };

  return (
    <div className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner bg-slate-100 dark:bg-slate-700 text-slate-400">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight group-hover:text-blue-500 transition-colors">
              {agent.AgentName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {agent.Specialization || 'General Assistant'}
            </p>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <span className="material-symbols-outlined text-[12px]">person</span>
              <span>by <span className="font-semibold text-slate-600 dark:text-slate-300">{agent.Owner?.UserName || "Unknown Architect"}</span></span>
            </div>
          </div>
        </div>

        {onEdit && (
          <button onClick={onEdit} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" title="Edit Agent">
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
        )}
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 h-10">
        {(agent.isPublished && agent.PublishedDescription) 
          ? agent.PublishedDescription 
          : (agent.Description || "No description provided.")}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {caps.length > 0 ? (
          caps.slice(0, 3).map((cap, idx) => (
            <span key={idx} className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide ${getBadgeStyle(idx)}`}>
              {cap}
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-400 italic">No capabilities</span>
        )}
        {caps.length > 3 && (
          <span className="px-2 py-1 rounded-md text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500">+{caps.length - 3}</span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 px-1 border-t border-slate-100 dark:border-slate-700/50 pt-4">
        <button 
          onClick={(e) => { e.stopPropagation(); if (onLike) onLike(); }}
          className={`flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
        >
          <span className={`material-symbols-outlined text-[18px] ${isLiked ? 'fill-current' : ''}`}>
            {isLiked ? 'favorite' : 'favorite_border'}
          </span>
          {likeCount}
        </button>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <span className="material-symbols-outlined text-[18px]">visibility</span>
          {agent.Views || 0}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          
          {/* --- NEW ADD BUTTON (Replaces Slider) --- */}
          {!isOwner && onAdd && (
            <button 
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span className="text-xs font-bold">Add</span>
            </button>
          )}

          {/* If it IS your agent, showing 'Published' badge is still useful here */}
          {agent.isPublished && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-md">
              <span className="material-symbols-outlined text-[14px]">public</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Published</span>
            </div>
          )}

        </div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{lastUpdated}</span>
      </div>
    </div>
  );
};

export default AgentCard2;