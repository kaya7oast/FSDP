import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const MarkdownMessage = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-4 mb-2" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-3 mb-2" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
        
        ul: ({ node, ...props }) => <ul className="list-disc list-inside ml-2 space-y-1" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal list-inside ml-2 space-y-1" {...props} />,
        li: ({ node, ...props }) => <li className="text-sm" {...props} />,
        
        pre: ({ node, ...props }) => (
          <pre 
            className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-3 rounded-lg my-2 overflow-x-auto w-full max-w-full" 
            {...props} 
          />
        ),
        
        code: ({ node, inline, className, ...props }) => {
          if (inline) {
            return (
              <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono break-all" {...props} />
            );
          }
          return (
            <code 
              className="font-mono text-xs whitespace-pre-wrap break-all" 
              {...props} 
            />
          );
        },
        
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-blue-500 pl-4 py-2 italic text-slate-600 dark:text-slate-400 my-2" {...props} />
        ),
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full border-collapse text-sm" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => <thead className="bg-slate-200 dark:bg-slate-700" {...props} />,
        th: ({ node, ...props }) => <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left font-semibold" {...props} />,
        td: ({ node, ...props }) => <td className="border border-slate-300 dark:border-slate-600 px-3 py-2" {...props} />,
        
        p: ({ node, ...props }) => <p className="mb-2 text-sm break-words" {...props} />,
        a: ({ node, ...props }) => <a className="text-blue-600 dark:text-blue-400 hover:underline break-all" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};