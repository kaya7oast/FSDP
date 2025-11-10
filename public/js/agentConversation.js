window.tailwind = window.tailwind || {};
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#137fec",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
    },
  },
};

// Conversation interactivity
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const agentListContainer = document.querySelector('aside .flex-grow .flex.flex-col');
  const createAgentBtn = document.querySelector('aside .p-4 > button');
  const headerTitle = document.querySelector('main header h2');
  const messageContainer = document.querySelector('.flex-1.overflow-y-auto.p-6.space-y-6');
  const composerInput = document.querySelector('input[placeholder="Type your message here..."]');
  const sendBtn = document.querySelector('main button.bg-primary');

  if (!agentListContainer || !messageContainer) return; // fail gracefully

  // In-memory conversations (no persistence)
  let conversations = {};
  const agentNodes = Array.from(agentListContainer.querySelectorAll(':scope > div'));
  agentNodes.forEach((node, idx) => {
    const name = node.querySelector('p')?.textContent?.trim() || `Agent ${idx+1}`;
    const icon = node.querySelector('span.material-symbols-outlined')?.textContent || '';
    conversations[`agent-${idx}`] = {
      id: `agent-${idx}`,
      name,
      avatarIcon: icon,
      messages: []
    };
  });
  // seed initial messages for first agent
  const firstId = Object.keys(conversations)[0];
  if (firstId) {
    conversations[firstId].messages.push({ from: 'agent', text: 'Hello! How can I help you today?', time: Date.now() - 60000 });
    conversations[firstId].messages.push({ from: 'user', text: 'I need to create a report on Q3 sales.', time: Date.now() - 30000 });
    conversations[firstId].messages.push({ from: 'agent', text: 'Of course. I can help with that. To get started, I need access to the sales data. Could you please specify the data source?', time: Date.now() - 10000 });
  }

  let currentAgentId = Object.keys(conversations)[0];

  function renderAgentList() {
    agentListContainer.innerHTML = '';
    Object.values(conversations).forEach(agent => {
      const item = document.createElement('div');
      item.className = 'flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer';
      item.dataset.agentId = agent.id;
      const iconEl = document.createElement('span');
      iconEl.className = 'material-symbols-outlined text-slate-600 dark:text-slate-400';
      iconEl.textContent = agent.avatarIcon || 'support_agent';
      const nameEl = document.createElement('p');
      nameEl.className = 'text-sm font-medium leading-normal text-slate-800 dark:text-slate-300';
      nameEl.textContent = agent.name;
      item.appendChild(iconEl);
      item.appendChild(nameEl);
      item.addEventListener('click', () => switchAgent(agent.id));
      agentListContainer.appendChild(item);
    });
  }

  function switchAgent(agentId) {
    if (!conversations[agentId]) return;
    currentAgentId = agentId;
    Array.from(agentListContainer.children).forEach(ch => ch.classList.remove('bg-primary/10', 'dark:bg-primary/20'));
    const activeEl = Array.from(agentListContainer.children).find(ch => ch.dataset.agentId === agentId);
    if (activeEl) activeEl.classList.add('bg-primary/10', 'dark:bg-primary/20');
    headerTitle.textContent = conversations[agentId].name;
    renderMessages(agentId);
  }

  function renderMessages(agentId) {
    const conv = conversations[agentId];
    if (!conv) return;
    messageContainer.innerHTML = '';
    conv.messages.forEach(msg => {
      const el = formatMessageElement(msg, agentId);
      messageContainer.appendChild(el);
    });
    scrollToBottom();
  }

  function formatMessageElement(msg, agentId) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-end gap-3 max-w-xl';
    const isUser = msg.from === 'user';
    if (isUser) wrapper.classList.add('justify-end', 'ml-auto');

    const avatar = document.createElement('div');
    avatar.className = 'bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0';
    avatar.style.backgroundImage = 'none';

    const col = document.createElement('div');
    col.className = 'flex flex-col gap-1.5 ' + (isUser ? 'items-end' : 'items-start');

    const meta = document.createElement('div');
    meta.className = 'flex items-center gap-2';
    const who = document.createElement('p');
    who.className = 'text-sm font-medium text-slate-800 dark:text-slate-200';
    who.textContent = isUser ? 'You' : conversations[agentId].name;
    const time = document.createElement('p');
    time.className = 'text-xs text-slate-400 dark:text-slate-500';
    time.textContent = new Date(msg.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    meta.appendChild(who);
    meta.appendChild(time);

    const bubble = document.createElement('p');
    bubble.className = 'text-base font-normal leading-relaxed rounded-xl px-4 py-3 shadow-sm';
    if (isUser) {
      bubble.classList.add('rounded-br-none', 'bg-primary', 'text-white');
    } else {
      bubble.classList.add('rounded-bl-none', 'bg-white', 'dark:bg-slate-800', 'text-slate-800', 'dark:text-slate-200');
    }
    bubble.textContent = msg.text;

    col.appendChild(meta);
    col.appendChild(bubble);

    if (isUser) {
      wrapper.appendChild(col);
      wrapper.appendChild(avatar);
    } else {
      wrapper.appendChild(avatar);
      wrapper.appendChild(col);
    }

    return wrapper;
  }

  function addMessage(agentId, from, text) {
    const msg = { from, text, time: Date.now() };
    conversations[agentId].messages.push(msg);
    if (agentId === currentAgentId) {
      const el = formatMessageElement(msg, agentId);
      messageContainer.appendChild(el);
      scrollToBottom();
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() => { messageContainer.scrollTop = messageContainer.scrollHeight; });
  }

  function sendCurrentMessage() {
    const text = composerInput.value.trim();
    if (!text) return;
    addMessage(currentAgentId, 'user', text);
    composerInput.value = '';
    setTimeout(() => {
      const reply = `Thanks — I received: "${text}". I'll look into that and get back to you.`;
      addMessage(currentAgentId, 'agent', reply);
    }, 700 + Math.random() * 800);
  }

  sendBtn?.addEventListener('click', sendCurrentMessage);
  composerInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCurrentMessage(); } });

  createAgentBtn?.addEventListener('click', () => {
    const name = prompt('New agent name');
    if (!name) return;
    const id = `agent-${Date.now()}`;
    conversations[id] = { id, name, avatarIcon: 'smart_toy', messages: [{ from: 'agent', text: `Hi, I'm ${name}. How can I help?`, time: Date.now() }] };
    renderAgentList();
    switchAgent(id);
  });

  // Right context panel functionality
  const rightAside = Array.from(document.querySelectorAll('aside')).slice(-1)[0];
  const rightCloseBtn = rightAside?.querySelector('div.p-4 button');
  const tabButtons = rightAside?.querySelectorAll('.flex.border-b button');
  const contextListContainer = rightAside?.querySelector('.space-y-4');

  // In-memory contexts (no persistence)
  let contexts = {};
  // seed from DOM for current agent
  const seedItems = Array.from(contextListContainer?.querySelectorAll('div') || []).map(div => ({
    text: div.querySelector('p')?.textContent || '',
    note: div.querySelectorAll('p')[1]?.textContent || ''
  }));
  contexts[currentAgentId] = { memory: seedItems.map(s => s.text), personality: [], tasks: [] };

  let activeContextTab = 'memory';

  function ensureAgentContext(agentId) {
    if (!contexts[agentId]) contexts[agentId] = { memory: [], personality: [], tasks: [] };
  }

  function renderContext(agentId) {
    ensureAgentContext(agentId);
    // render control bar (input + add)
    let controlBar = rightAside.querySelector('.context-control-bar');
    if (!controlBar) {
      controlBar = document.createElement('div');
      controlBar.className = 'context-control-bar flex items-center gap-2 mb-3';
      const input = document.createElement('input');
      input.placeholder = 'Add note...';
      input.className = 'flex-1 rounded-md px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-sm';
      const addBtn = document.createElement('button');
      addBtn.className = 'px-3 py-2 bg-primary text-white rounded-md text-sm';
      addBtn.textContent = 'Add';
      addBtn.addEventListener('click', () => {
        const text = input.value.trim();
        if (!text) return;
        addContextItem(agentId, activeContextTab, text);
        input.value = '';
      });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });
      controlBar.appendChild(input);
      controlBar.appendChild(addBtn);
      contextListContainer.parentElement.insertBefore(controlBar, contextListContainer);
    }

    // render list
    contextListContainer.innerHTML = '';
    const list = contexts[agentId][activeContextTab] || [];
    if (list.length === 0) {
      const none = document.createElement('div');
      none.className = 'p-3 rounded-lg bg-slate-100 dark:bg-slate-800';
      none.textContent = 'No items';
      contextListContainer.appendChild(none);
      return;
    }

    list.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'p-3 rounded-lg bg-slate-100 dark:bg-slate-800 flex justify-between items-start';
      const left = document.createElement('div');
      left.className = 'flex-1';
      const p = document.createElement('p');
      p.className = 'text-sm font-medium text-slate-800 dark:text-slate-200';
      p.textContent = item;
      left.appendChild(p);
      row.appendChild(left);
      const del = document.createElement('button');
      del.className = 'ml-3 text-sm text-slate-500 dark:text-slate-400';
      del.textContent = 'Delete';
      del.addEventListener('click', () => {
        contexts[agentId][activeContextTab].splice(idx, 1);
        renderContext(agentId);
      });
      row.appendChild(del);
      contextListContainer.appendChild(row);
    });
  }

  function addContextItem(agentId, tab, text) {
    ensureAgentContext(agentId);
    contexts[agentId][tab].unshift(text);
    renderContext(agentId);
  }

  // Tab handling
  if (tabButtons) {
    tabButtons.forEach((btn, i) => {
      const tabKey = ['memory', 'personality', 'tasks'][i] || 'memory';
      btn.addEventListener('click', () => {
        activeContextTab = tabKey;
        tabButtons.forEach(b => b.classList.remove('border-primary', 'text-primary'));
        btn.classList.add('border-primary', 'text-primary');
        renderContext(currentAgentId);
      });
    });
  }

  // initialize active tab style
  if (tabButtons && tabButtons[0]) tabButtons[0].classList.add('border-primary', 'text-primary');

  // close/open right panel
  if (rightCloseBtn) {
    rightCloseBtn.addEventListener('click', () => {
      rightAside.style.display = 'none';
      const openBtn = document.createElement('button');
      openBtn.className = 'z-50 bg-primary text-white px-3 py-2 rounded-md shadow-lg';
      openBtn.textContent = 'Context';
      // position to avoid overlapping the send button if present
      function positionOpenBtn() {
        // default fixed offset
        openBtn.style.position = 'fixed';
        const gap = 12; // px gap from send button
        if (sendBtn) {
          const sendRect = sendBtn.getBoundingClientRect();
          // place openBtn above the send button (so it won't overlap)
          const bottom = window.innerHeight - sendRect.top + gap;
          // align to same right offset as existing page padding
          openBtn.style.right = '16px';
          openBtn.style.bottom = `${bottom}px`;
        } else {
          // fallback: bottom-right corner
          openBtn.style.right = '16px';
          openBtn.style.bottom = '16px';
        }
      }

      openBtn.addEventListener('click', () => { rightAside.style.display = ''; openBtn.remove(); window.removeEventListener('resize', positionOpenBtn); });
      document.body.appendChild(openBtn);
      // initial position and keep it updated on resize/scroll
      positionOpenBtn();
      window.addEventListener('resize', positionOpenBtn);
      window.addEventListener('scroll', positionOpenBtn);
    });
  }

  // render initial context for current agent
  ensureAgentContext(currentAgentId);
  renderContext(currentAgentId);

  renderAgentList();
  switchAgent(currentAgentId);
});