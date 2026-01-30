import React from 'react';

const AgentCard2 = ({ 
  agent, 
  currentUserId, 
  onLike,        
  onEdit, 
  onToggleStatus,
  isOwner // Helper to know if viewing own agent
}) => {
  const isActive = String(agent?.status || agent?.Status || "").toLowerCase() === "active";
  const caps = agent?.Capabilities ?? [];
  const lastUpdated = agent?.UpdatedAt 
    ? new Date(agent.UpdatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
    : 'New';

  // Check if current user liked this agent
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
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          {/* Icon Box */}
          <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner
            ${isActive 
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
            }`}>
            <span className="material-symbols-outlined">smart_toy</span>
            {isActive && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></span>
            )}
          </div>
          
          {/* Name & Role */}
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight group-hover:text-blue-500 transition-colors">
              {agent.AgentName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {agent.Specialization || 'General Assistant'}
            </p>
          </div>
        </div>

        {/* Edit Button (Only visible if you are the owner) */}
        {onEdit && (
          <button 
            onClick={onEdit} 
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
            title="Edit Agent"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
        )}
      </div>

      {/* --- DESCRIPTION --- */}
      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 h-10">
        {(agent.isPublished && agent.PublishedDescription) 
          ? agent.PublishedDescription 
          : (agent.Description || "No description provided.")}
      </p>

      {/* --- TAGS --- */}
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

      {/* --- STATS ROW (Likes & Views) --- */}
      <div className="flex items-center gap-4 mb-4 px-1 border-t border-slate-100 dark:border-slate-700/50 pt-4">
        {/* Like Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (onLike) onLike();
          }}
          className={`flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95
            ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
        >
          <span className={`material-symbols-outlined text-[18px] ${isLiked ? 'fill-current' : ''}`}>
            {isLiked ? 'favorite' : 'favorite_border'}
          </span>
          {likeCount}
        </button>

        {/* View Count */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <span className="material-symbols-outlined text-[18px]">visibility</span>
          {agent.Views || 0}
        </div>
      </div>

      {/* --- FOOTER: Status & Badge --- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          
          {/* Active Slider (Interactive only if owner) */}
          <label className={`relative inline-flex items-center ${isOwner ? 'cursor-pointer' : 'cursor-default'}`}>
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={isActive}
              disabled={!isOwner} 
              onChange={isOwner && onToggleStatus ? onToggleStatus : () => {}}
            />
            <div className={`w-9 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 
              peer-checked:after:translate-x-full peer-checked:after:border-white 
              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
              after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all 
              dark:border-gray-600 peer-checked:bg-blue-500 ${!isOwner ? 'opacity-80' : ''}`}>
            </div>
            {isOwner && (
               <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-400">{isActive ? 'Active' : 'Inactive'}</span>
            )}
          </label>

          {/* Published Badge */}
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