import React, { useState, useRef, useEffect } from 'react';

const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState("");
  const [showGithubInput, setShowGithubInput] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const inputRef = useRef(null);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- NEW SLEEK GITHUB HANDLER ---
  const submitGithubUrl = () => {
    if (githubUrl && githubUrl.includes('github.com')) {
        const systemNote = `[SYSTEM: The user wants to discuss this codebase: ${githubUrl}. Please focus on code analysis.]`;
        onSendMessage(systemNote + ` I've linked the repository: ${githubUrl}`);
        setGithubUrl("");
        setShowGithubInput(false);
    } else {
        // Subtle shake or border red could go here, for now just close if empty
        setShowGithubInput(false);
    }
  };

  useEffect(() => {
    if (showGithubInput && inputRef.current) {
        inputRef.current.focus();
    }
  }, [showGithubInput]);

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* --- THE GITHUB SLIDE-DOWN PANEL --- */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showGithubInput ? 'max-h-16 opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
            <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="material-symbols-outlined text-slate-500 pl-2">link</span>
                <input 
                    ref={inputRef}
                    type="text" 
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="Paste GitHub Repository URL..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-500"
                    onKeyDown={(e) => e.key === 'Enter' && submitGithubUrl()}
                />
                <button onClick={submitGithubUrl} className="text-xs bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg font-bold hover:opacity-80 transition-opacity">
                    Link Repo
                </button>
                <button onClick={() => setShowGithubInput(false)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>
        </div>

        {/* --- MAIN INPUT BAR --- */}
        <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all shadow-sm">
            
            {/* Action Buttons */}
            <div className="flex pb-2 pl-2 gap-1">
                {/* Replaced 'Attach' with GitHub Toggle */}
                <button 
                    onClick={() => setShowGithubInput(!showGithubInput)}
                    className={`p-2 rounded-lg transition-colors ${showGithubInput ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    title="Connect GitHub Repo"
                >
                    <span className="material-symbols-outlined">code</span>
                </button>
            </div>

            <textarea
                disabled={disabled}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none py-3 max-h-32 focus:outline-none"
                style={{ minHeight: '44px' }}
            />

            <button 
                onClick={handleSend}
                disabled={!message.trim() || disabled}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md mb-0.5"
            >
                <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;