import React from 'react';

const AgentCard = ({ agent }) => {
  return (
    <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-900 dark:text-white text-lg font-bold leading-normal">{agent.AgentName}</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal mt-1">{agent.Description}</p>
        </div>

        <div className="flex items-center">
          <input
            aria-label={`Enable ${agent.AgentName}`}
            checked={agent.Status === "active"}
            className="h-4 w-8 appearance-none rounded-full bg-slate-300 dark:bg-slate-700 checked:bg-primary transition duration-200 ease-in-out cursor-pointer"
            type="checkbox"
          />
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
        <span>{agent.Status === "active" ? 'Active' : 'Inactive'}</span>
        <button className="text-primary hover:underline">Edit</button>
      </div>
    </div>
  );
};

export default AgentCard;