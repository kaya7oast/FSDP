import React from 'react';

const AgentAnalytics = () => {
  // Mock data for visualization
  const performanceData = [
    { name: 'Mon', value: 40 },
    { name: 'Tue', value: 65 },
    { name: 'Wed', value: 45 },
    { name: 'Thu', value: 90 },
    { name: 'Fri', value: 75 },
    { name: 'Sat', value: 50 },
    { name: 'Sun', value: 60 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics & Performance</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Deep dive into your agent workforce metrics.</p>
        </div>
        <div className="flex gap-2">
          <select className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Year</option>
          </select>
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Interactions" value="124,592" trend="+12.5%" isPositive={true} icon="forum" color="blue" />
        <MetricCard title="Avg. Response Time" value="1.2s" trend="-0.4s" isPositive={true} icon="timer" color="purple" />
        <MetricCard title="User Satisfaction" value="4.8/5" trend="+0.2" isPositive={true} icon="sentiment_satisfied" color="emerald" />
        <MetricCard title="Active Sessions" value="843" trend="-5%" isPositive={false} icon="group" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Interaction Volume</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {performanceData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                <div className="relative w-full bg-slate-100 dark:bg-slate-700 rounded-t-lg overflow-hidden h-full flex items-end">
                  <div 
                    style={{ height: `${item.value}%` }} 
                    className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-300 rounded-t-lg relative group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                  ></div>
                </div>
                <span className="text-xs text-slate-500 font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Agents List */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Top Performers</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  #{i}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Support Bot {i}</h4>
                  <p className="text-xs text-slate-500">98% Resolution Rate</p>
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">4.9 ★</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
            View All Agents
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, trend, isPositive, icon, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  };

  return (
    <div className="glass-card p-6 rounded-2xl hover:-translate-y-1 transition-transform">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {trend}
        </span>
      </div>
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
    </div>
  );
};

export default AgentAnalytics;