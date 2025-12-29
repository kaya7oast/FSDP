import React from 'react';

const AgentCard = ({ agent, onEdit, onDuplicate, onDelete, onToggleStatus }) => {
  const isActive = String(agent?.status || agent?.Status || "").toLowerCase() === "active";
  const caps = agent?.Capabilities ?? [];
  const lastUpdated = agent?.UpdatedAt 
    ? new Date(agent.UpdatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
    : 'New';

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
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
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
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight group-hover:text-blue-500 transition-colors">
              {agent.AgentName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {agent.Specialization || 'General Assistant'}
            </p>
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-x-2 group-hover:translate-x-0">
          <button onClick={onEdit} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors" title="Edit">
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button onClick={onDuplicate} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-purple-500 transition-colors" title="Duplicate">
            <span className="material-symbols-outlined text-[20px]">content_copy</span>
          </button>
          <button onClick={onDelete} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 h-10">
        {agent.Description || "No description provided."}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {caps.length > 0 ? (
          caps.slice(0, 3).map((cap, idx) => (
            <span key={idx} className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide ${getBadgeStyle(idx)}`}>
              {cap}
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-400 italic">No capabilities defined</span>
        )}
        {caps.length > 3 && (
          <span className="px-2 py-1 rounded-md text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500">+{caps.length - 3}</span>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={isActive}
              onChange={onToggleStatus}
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
            <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-400">{isActive ? 'Active' : 'Inactive'}</span>
          </label>
        </div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Updated {lastUpdated}</span>
      </div>
    </div>
  );
};

export default AgentCard;