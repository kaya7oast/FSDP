"use client"

import { useState } from "react"
import { Button } from "./button.jsx"
import { Input } from "./input.jsx"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar.jsx"
import { Search, MoreVertical, Send, Paperclip, Mic, X, Megaphone, Headset, FlaskConical } from 'lucide-react'

const agents = [
  {
    id: "marketing",
    name: "Marketing Assistant",
    icon: <Megaphone className="h-5 w-5" />,
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=marketing",
    status: "online"
  },
  {
    id: "support",
    name: "Customer Support Bot",
    icon: <Headset className="h-5 w-5" />,
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=support",
    status: "online"
  },
  {
    id: "research",
    name: "Research Analyst",
    icon: <FlaskConical className="h-5 w-5" />,
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=research",
    status: "offline"
  }
]

export default function AIAgentChat() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0])
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "agent",
      content: "Hello! How can I help you today?",
      timestamp: "10:30 AM",
      avatar: agents[0].avatar
    },
    {
      id: "2",
      sender: "user",
      content: "I need to create a report on Q3 sales.",
      timestamp: "10:31 AM",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john"
    },
    {
      id: "3",
      sender: "agent",
      content: "Of course. I can help with that. To get started, I need access to the sales data. Could you please specify the data source?",
      timestamp: "10:32 AM",
      avatar: agents[0].avatar
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [activeTab, setActiveTab] = useState("memory")
  const [showContext, setShowContext] = useState(true)

  const contextData = {
    memory: [
      { id: "1", content: "User needs a Q3 sales report.", source: "Learned from last message" },
      { id: "2", content: "User's name is John Doe.", source: "From user profile" },
      { id: "3", content: "Sales data source is not yet specified.", source: "Inferred from conversation" }
    ],
    personality: [
      { id: "1", content: "Friendly", source: "Core trait" },
      { id: "2", content: "Helpful", source: "Core trait" },
      { id: "3", content: "Professional", source: "Core trait" }
    ],
    tasks: [
      { id: "1", content: "Sent email to John Doe", source: "Completed" },
      { id: "2", content: "Create report on Q3 sales", source: "Pending" }
    ]
  }

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const newMessage = {
      id: Date.now().toString(),
      sender: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john"
    }

    setMessages([...messages, newMessage])
    setInputMessage("")

    // Simulate agent response
    setTimeout(() => {
      const agentResponse = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        content: "I'm processing your request. How else can I assist you?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: selectedAgent.avatar
      }
      setMessages(prev => [...prev, agentResponse])
    }, 1000)
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950">
      {/* Left Sidebar */}
      <aside className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=john" alt="John Doe" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h1 className="text-base font-medium leading-normal text-slate-900 dark:text-white">John Doe</h1>
              <p className="text-sm font-normal leading-normal text-slate-500 dark:text-slate-400">john.doe@example.com</p>
            </div>
          </div>
        </div>

        <div className="flex-grow p-4 overflow-y-auto">
          <div className="flex flex-col gap-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  selectedAgent.id === agent.id
                    ? "bg-blue-500/10 dark:bg-blue-500/20"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className={selectedAgent.id === agent.id ? "text-blue-500" : "text-slate-600 dark:text-slate-400"}>
                  {agent.icon}
                </span>
                <p className={`text-sm font-medium leading-normal ${
                  selectedAgent.id === agent.id
                    ? "text-blue-500"
                    : "text-slate-800 dark:text-slate-300"
                }`}>
                  {agent.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            Create new agent
          </Button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 px-6 py-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedAgent.avatar || "/placeholder.svg"} alt={selectedAgent.name} />
                <AvatarFallback>{selectedAgent.name[0]}</AvatarFallback>
              </Avatar>
              {selectedAgent.status === "online" && (
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900"></span>
              )}
            </div>
            <h2 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">{selectedAgent.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-slate-500 dark:text-slate-400">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-500 dark:text-slate-400">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-3 ${
                message.sender === "user" ? "justify-end ml-auto max-w-xl" : "max-w-xl"
              }`}
            >
              {message.sender === "agent" && (
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={message.avatar || "/placeholder.svg"} />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div className={`flex flex-col gap-1.5 ${message.sender === "user" ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {message.sender === "user" ? "You" : selectedAgent.name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{message.timestamp}</p>
                </div>
                <p className={`text-base font-normal leading-relaxed rounded-xl px-4 py-3 shadow-sm ${
                  message.sender === "user"
                    ? "rounded-br-none bg-blue-500 text-white"
                    : "rounded-bl-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                }`}>
                  {message.content}
                </p>
              </div>
              {message.sender === "user" && (
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={message.avatar || "/placeholder.svg"} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Input
                className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Type your message here..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <div className="flex items-center gap-1 p-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 dark:text-slate-400">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 dark:text-slate-400">
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              className="h-12 w-12 shrink-0 bg-blue-500 hover:bg-blue-600 text-white"
              size="icon"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>

      {/* Right Context Panel */}
      {showContext && (
        <aside className="w-80 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Context</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowContext(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex border-b border-slate-200 dark:border-slate-800">
            {["memory", "personality", "tasks"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-grow p-4 overflow-y-auto">
            <div className="space-y-4">
              {contextData[activeTab].map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.content}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.source}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
