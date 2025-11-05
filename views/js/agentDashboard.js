window.tailwind = window.tailwind || {};
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#4A90E2",
                "background-light": "#F7F9FC",
                "background-dark": "#101922",
                "text-light": "#333333",
                "text-dark": "#F7F9FC",
                "border-light": "#E0E0E0",
                "border-dark": "#2a3642",
                "success": "#28A745",
                "inactive": "#6C757D",
                "danger": "#DC3545",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "0.75rem",
                "xl": "1rem",
                "full": "9999px"
            },
        },
    },
};

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Search functionality
    const searchInput = document.querySelector('input[placeholder="Search agents..."]');
    const agentCards = document.querySelectorAll('.md\\:col-span-8 .grid > div');
    
    // Filter buttons
    const statusFilterBtn = document.getElementById('statusFilterBtn');
    const capabilitiesFilterBtn = document.getElementById('capabilitiesFilterBtn');
    
    // View toggle buttons
    const gridViewBtn = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.querySelector('span.material-symbols-outlined')?.textContent === 'grid_view'
    );
    const listViewBtn = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.querySelector('span.material-symbols-outlined')?.textContent === 'table_rows'
    );
    
    // Create New Agent button
    const createNewAgentBtn = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.trim() === 'Create New Agent'
    );

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        agentCards.forEach(card => {
            const agentName = card.querySelector('h3').textContent.toLowerCase();
            const capabilities = Array.from(card.querySelectorAll('.flex-wrap span'))
                .map(span => span.textContent.toLowerCase());
            
            const isMatch = agentName.includes(searchTerm) || 
                capabilities.some(cap => cap.includes(searchTerm));
            
            card.style.display = isMatch ? 'flex' : 'none';
        });
    });

    // Status filter dropdown
    const statusOptions = ['All', 'Active', 'Archived'];
    let currentStatusFilter = 'All';

    statusFilterBtn.addEventListener('click', () => {
        const dropdown = createDropdown(statusOptions, (status) => {
            currentStatusFilter = status;
            filterAgents();
            statusFilterBtn.querySelector('p').textContent = `Status: ${status}`;
        });
        positionDropdown(dropdown, statusFilterBtn);
    });

    // Capabilities filter
    const capabilityOptions = ['All', 'NLP', 'Customer Support', 'Data Analysis', 'Reporting', 'Image Generation', 'Code Generation'];
    let currentCapabilityFilter = 'All';

    capabilitiesFilterBtn.addEventListener('click', () => {
        const dropdown = createDropdown(capabilityOptions, (capability) => {
            currentCapabilityFilter = capability;
            filterAgents();
            capabilitiesFilterBtn.querySelector('p').textContent = `Capabilities: ${capability}`;
        });
        positionDropdown(dropdown, capabilitiesFilterBtn);
    });

    // View toggle functionality
    gridViewBtn.addEventListener('click', () => {
        const agentGrid = document.querySelector('.md\\:col-span-8 .grid');
        agentGrid.classList.remove('grid-cols-1');
        agentGrid.classList.add('lg:grid-cols-2');
        gridViewBtn.parentElement.querySelector('.text-inactive')?.classList.remove('text-inactive');
        gridViewBtn.classList.add('text-primary');
        listViewBtn.classList.remove('text-primary');
        listViewBtn.classList.add('text-inactive');
    });

    listViewBtn.addEventListener('click', () => {
        const agentGrid = document.querySelector('.md\\:col-span-8 .grid');
        agentGrid.classList.remove('lg:grid-cols-2');
        agentGrid.classList.add('grid-cols-1');
        listViewBtn.parentElement.querySelector('.text-inactive')?.classList.remove('text-inactive');
        listViewBtn.classList.add('text-primary');
        gridViewBtn.classList.remove('text-primary');
        gridViewBtn.classList.add('text-inactive');
    });

    // Agent card actions
    document.querySelectorAll('.md\\:col-span-8 .grid > div').forEach(card => {
        const editBtn = Array.from(card.querySelectorAll('button')).find(btn => 
            btn.querySelector('span.material-symbols-outlined')?.textContent === 'edit'
        );
        const copyBtn = Array.from(card.querySelectorAll('button')).find(btn => 
            btn.querySelector('span.material-symbols-outlined')?.textContent === 'content_copy'
        );
        const deleteBtn = Array.from(card.querySelectorAll('button')).find(btn => 
            btn.querySelector('span.material-symbols-outlined')?.textContent === 'delete'
        );

        editBtn?.addEventListener('click', () => {
            const agentName = card.querySelector('h3').textContent;
            console.log(`Editing agent: ${agentName}`);
            // Add edit functionality
        });

        copyBtn?.addEventListener('click', () => {
            const agentName = card.querySelector('h3').textContent;
            console.log(`Duplicating agent: ${agentName}`);
            // Add duplication functionality
        });

        deleteBtn?.addEventListener('click', () => {
            const agentName = card.querySelector('h3').textContent;
            if (confirm(`Are you sure you want to delete ${agentName}?`)) {
                card.remove();
                updateStatistics();
            }
        });
    });

    // Helper functions
    function createDropdown(options, onSelect) {
        // Remove any existing dropdowns
        document.querySelectorAll('.filter-dropdown').forEach(el => el.remove());
        
        const dropdown = document.createElement('div');
        dropdown.className = 'filter-dropdown absolute z-50 bg-white dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg py-2 mt-2';
        
        options.forEach(option => {
            const item = document.createElement('button');
            item.className = 'w-full text-left px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors';
            item.textContent = option;
            item.addEventListener('click', () => {
                onSelect(option);
                dropdown.remove();
            });
            dropdown.appendChild(item);
        });

        // Close dropdown when clicking outside
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 0);

        return dropdown;
    }

    function positionDropdown(dropdown, anchor) {
        document.body.appendChild(dropdown);
        const rect = anchor.getBoundingClientRect();
        const dropdownHeight = dropdown.offsetHeight;
        const spaceBelow = window.innerHeight - rect.bottom;
        
        dropdown.style.position = 'fixed';
        
        // Position above if not enough space below
        if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
            dropdown.style.bottom = `${window.innerHeight - rect.top}px`;
        } else {
            dropdown.style.top = `${rect.bottom}px`;
        }
        
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.minWidth = `${anchor.offsetWidth}px`;
        dropdown.style.maxHeight = '300px';
        dropdown.style.overflowY = 'auto';
    }

    function filterAgents() {
        agentCards.forEach(card => {
            const statusElement = Array.from(card.querySelectorAll('p')).find(p => 
                p.querySelector('span.rounded-full')
            );
            const status = statusElement ? statusElement.textContent : '';
            const capabilities = Array.from(card.querySelectorAll('.flex-wrap span'))
                .map(span => span.textContent);
            
            const statusMatch = currentStatusFilter === 'All' || 
                (currentStatusFilter === 'Active' && status.includes('Active')) ||
                (currentStatusFilter === 'Archived' && status.includes('Archived'));
            
            const capabilityMatch = currentCapabilityFilter === 'All' ||
                capabilities.some(cap => cap === currentCapabilityFilter);
            
            card.style.display = statusMatch && capabilityMatch ? 'flex' : 'none';
        });
        updateStatistics();
    }

    function updateStatistics() {
        // Update total interactions
        const visibleAgents = Array.from(agentCards).filter(card => card.style.display !== 'none');
        const totalInteractions = visibleAgents.reduce((total, agent) => {
            return total + Math.floor(Math.random() * 100000); // Simulated data
        }, 0);
        
        document.querySelector('.text-3xl.font-bold').textContent = totalInteractions.toLocaleString();
        
        // Update top performing agents
        const topAgentsList = document.querySelector('.space-y-3');
        const topAgents = visibleAgents
            .map(agent => ({
                name: agent.querySelector('h3').textContent,
                interactions: Math.floor(Math.random() * 500000)
            }))
            .sort((a, b) => b.interactions - a.interactions)
            .slice(0, 3);
            
        topAgentsList.innerHTML = topAgents
            .map(agent => `
                <li class="flex items-center justify-between">
                    <p class="text-sm font-medium text-text-light dark:text-text-dark">${agent.name}</p>
                    <p class="text-sm font-semibold text-primary">${(agent.interactions/1000).toFixed(0)}k</p>
                </li>
            `)
            .join('');
    }
});
