function AgentDashboard() {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-text-light dark:text-text-dark min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-3xl">hub</span>
            <h2 className="text-xl font-bold">
              <a href="/views/agentHomepage.html">AI Agent Platform</a>
            </h2>
          </div>

          <nav className="hidden md:flex items-center gap-9">
            <a className="text-sm font-semibold text-primary" href="/views/agentDashboard.html">Dashboard</a>
            <a className="text-sm text-text-light dark:text-text-dark hover:text-primary" href="/views/agentHomepage.html">Agents</a>
            <a className="text-sm text-text-light dark:text-text-dark hover:text-primary" href="/views/agentConversation.html">Conversations</a>
          </nav>

          <div className="flex items-center gap-4">
            <HeaderButton icon="help_outline" />
            <HeaderButton icon="notifications" />
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC5mfB8ZF2ZNMlBhmxmZq6UJfT5JoykPuBTrgVIML-6u-H8snZ-WITA1mGeoB4DdGwzHGnDkAPIudEMno19-wUsQaIVlu_IEJIygjJWse0v5GIPyPMDcvidPY8SPCP-Gtyrr5c72ZXhWmGNe2CHhgxcUiioAF8mkCa_nKMk5XWORJoG6OnZj2qJqPjWcYT2mkVMJReVFwyGgjdJXR01CjBp6aBSyoF7AC4qgH7JM8gKA8u07eZ_rGkI_x1CRlRFYq0qk4cC9fK07yM")',
              }}
            ></div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <p className="text-4xl font-black tracking-[-0.033em]">Agent Management</p>
            <a
              href="./agentBuilder.html"
              className="flex items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <span className="truncate">Create New Agent</span>
            </a>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <SearchBar />
            <FilterBar />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AgentCard
                  title="Customer Support Bot"
                  icon="support_agent"
                  status="Active"
                  tags={["NLP", "Customer Support"]}
                  updated="2 days ago"
                />
                <AgentCard
                  title="Data Analyst"
                  icon="bar_chart"
                  status="Active"
                  tags={["Data Analysis", "Reporting"]}
                  updated="5 days ago"
                />
                <AgentCard
                  title="Image Generator"
                  icon="image"
                  status="Archived"
                  tags={["Image Generation", "Creative"]}
                  updated="1 month ago"
                />
                <AgentCard
                  title="Code Assistant"
                  icon="code"
                  status="Active"
                  tags={["Code Generation", "Developer Tool"]}
                  updated="8 hours ago"
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <UsageStats />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function HeaderButton({ icon }) {
  return (
    <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
      <span className="material-symbols-outlined text-text-light dark:text-text-dark">{icon}</span>
    </button>
  );
}

function SearchBar() {
  return (
    <div className="flex-1">
      <label className="flex flex-col w-full h-12">
        <div className="flex w-full items-stretch rounded-lg h-full bg-white dark:bg-background-dark border border-border-light dark:border-border-dark">
          <div className="text-inactive flex items-center justify-center pl-4">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            className="form-input flex-1 bg-transparent text-text-light dark:text-text-dark px-2 focus:outline-none"
            placeholder="Search agents..."
          />
        </div>
      </label>
    </div>
  );
}

function FilterBar() {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      <FilterButton label="Status: All" />
      <FilterButton label="Capabilities: All" />
      <div className="flex items-center rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark h-12">
        <button className="w-12 h-12 flex items-center justify-center text-primary bg-primary/10 dark:bg-primary/20 rounded-l-lg">
          <span className="material-symbols-outlined">grid_view</span>
        </button>
        <button className="w-12 h-12 flex items-center justify-center text-inactive hover:bg-gray-50 dark:hover:bg-gray-800 rounded-r-lg">
          <span className="material-symbols-outlined">table_rows</span>
        </button>
      </div>
    </div>
  );
}

function FilterButton({ label }) {
  return (
    <button className="flex h-12 items-center gap-x-2 rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark pl-4 pr-3 hover:bg-gray-50 dark:hover:bg-gray-800">
      <p className="text-sm font-medium text-text-light dark:text-text-dark">{label}</p>
      <span className="material-symbols-outlined text-inactive">expand_more</span>
    </button>
  );
}

function AgentCard({ title, icon, status, tags, updated }) {
  const isActive = status === "Active";
  const isArchived = status === "Archived";
  return (
    <div className="bg-white dark:bg-background-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? "bg-primary/10 dark:bg-primary/20" : "bg-gray-200 dark:bg-gray-700"}`}>
            <span className={`material-symbols-outlined text-2xl ${isActive ? "text-primary" : "text-inactive"}`}>{icon}</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className={`text-sm font-medium flex items-center gap-1.5 ${isActive ? "text-success" : "text-inactive"}`}>
              <span className={`w-2 h-2 rounded-full ${isActive ? "bg-success" : "bg-inactive"}`}></span>
              {status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <CardButton icon="edit" />
          <CardButton icon="content_copy" />
          <CardButton icon="delete" danger />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
              isArchived
                ? "bg-gray-200 dark:bg-gray-700 text-inactive"
                : "bg-primary/10 dark:bg-primary/20 text-primary"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="text-sm text-inactive">Last updated: {updated}</p>
    </div>
  );
}

function CardButton({ icon, danger }) {
  return (
    <button
      className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${
        danger ? "text-inactive hover:text-danger" : "text-inactive hover:text-primary"
      }`}
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
    </button>
  );
}

function UsageStats() {
  return (
    <div className="bg-white dark:bg-background-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 sticky top-24">
      <h2 className="text-[22px] font-bold mb-6">Usage Statistics</h2>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-inactive font-medium mb-1">Total Interactions</p>
          <p className="text-3xl font-bold">1,245,678</p>
        </div>
        <div>
          <p className="text-sm text-inactive font-medium mb-2">Interactions per Day</p>
          <div className="h-24 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-end p-2">
            {[60, 80, 40, 100, 75, 65].map((h, i) => (
              <div key={i} style={{ height: `${h}%` }} className="w-1/6 bg-primary rounded-t-sm"></div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm text-inactive font-medium mb-3">Top Performing Agents</p>
          <ul className="space-y-3">
            <li className="flex items-center justify-between">
              <p className="text-sm font-medium">Customer Support Bot</p>
              <p className="text-sm font-semibold text-primary">450k</p>
            </li>
            <li className="flex items-center justify-between">
              <p className="text-sm font-medium">Data Analyst</p>
              <p className="text-sm font-semibold text-primary">312k</p>
            </li>
            <li className="flex items-center justify-between">
              <p className="text-sm font-medium">Code Assistant</p>
              <p className="text-sm font-semibold text-primary">289k</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
