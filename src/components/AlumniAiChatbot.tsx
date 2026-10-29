import React, { useState, useRef, useEffect } from 'react';
import { TelegramUser, Institution, AlumniProfile, ChatMessage, AiAdvisorRole } from '../types';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { safeFetchJson } from '../lib/apiClient';
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  X,
  User,
  GraduationCap,
  Briefcase,
  Globe,
  Rocket,
  ChevronDown,
  Cpu,
  MessageSquare,
  RefreshCw,
  Zap,
  CheckCircle2,
  Copy,
  Compass,
  MapPin,
  TrendingUp
} from 'lucide-react';

interface AlumniAiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TelegramUser;
  activeInstitution: Institution | null;
  profile?: AlumniProfile | null;
  initialRole?: AiAdvisorRole;
  initialPrompt?: string;
}

const AI_ROLES: {
  id: AiAdvisorRole;
  name: string;
  badge: string;
  icon: React.ElementType;
  color: string;
  description: string;
  suggestedPrompts: string[];
}[] = [
  {
    id: 'CAREER_ROADMAP',
    name: 'Executive Career Roadmap Architect',
    badge: '3-Phase Career Plan',
    icon: Compass,
    color: 'from-cyan-500 to-blue-600',
    description: 'Generates a personalized, structured 3-phase career progression roadmap with specific milestones and alumni networking action steps.',
    suggestedPrompts: [
      'Generate a personalized 3-phase career development roadmap based on my alumni profile.',
      'What certifications and system design skills should I target for my next senior promotion?',
      'How can I leverage alumni mentors at my target tech companies to accelerate my career roadmap?'
    ]
  },
  {
    id: 'CAREER_STRATEGIST',
    name: 'Alumni Career Strategist',
    badge: 'Career & Networking',
    icon: Briefcase,
    color: 'from-blue-500 to-indigo-600',
    description: 'Specializes in resume optimization, career pivots, tech compensation, and senior alumni networking.',
    suggestedPrompts: [
      'How do I write a high-converting Telegram message to connect with a senior alumnus?',
      'Review my career pitch for moving from backend engineer to system architect.',
      'What are the key tech industries hiring alumni right now?'
    ]
  },
  {
    id: 'MOCK_INTERVIEWER',
    name: 'Technical & System Design Coach',
    badge: 'Mock Interviewer',
    icon: Cpu,
    color: 'from-emerald-500 to-teal-600',
    description: 'Conducts interactive mock interviews, evaluates STAR answers, and asks system design questions.',
    suggestedPrompts: [
      'Conduct a 3-question behavioral mock interview for a Senior Software Engineer.',
      'Ask me a system design question about designing an alumni notification queue.',
      'How should I explain a 6-month employment gap professionally?'
    ]
  },
  {
    id: 'POSTGRAD_SCHOLARSHIP',
    name: 'Global Scholarship Counselor',
    badge: 'Postgrad & Admissions',
    icon: Globe,
    color: 'from-purple-500 to-pink-600',
    description: 'Guides scholarship applications for Chevening, Erasmus Mundus, Commonwealth, Fulbright, and DAAD.',
    suggestedPrompts: [
      'What are the key requirements for the Chevening Scholarship leadership essay?',
      'How do I tailor my alumni undergraduate research into a competitive European Masters SOP?',
      'Which universities offer full funding for African graduates in AI and robotics?'
    ]
  },
  {
    id: 'STARTUP_FOUNDER_MENTOR',
    name: 'Alumni Venture & Angel Mentor',
    badge: 'Startups & Funding',
    icon: Rocket,
    color: 'from-amber-500 to-orange-600',
    description: 'Provides venture feedback, tech stack trade-offs, MVP scoping, and investor deck reviews.',
    suggestedPrompts: [
      'Critique my startup idea: A Telegram-native micro-SaaS for university alumni associations.',
      'What key metrics should we highlight when pitching alumni angel investors?',
      'How should an early-stage founder budget engineering infrastructure?'
    ]
  }
];


const AVAILABLE_MODELS = [
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', tag: 'Recommended', speed: 'Fast & Balanced' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', tag: 'Fastest', speed: 'Ultra-low latency' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', tag: 'Deep Reasoning', speed: 'Advanced STEM / Code' }
];

export const AlumniAiChatbot: React.FC<AlumniAiChatbotProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeInstitution,
  profile,
  initialRole = 'CAREER_STRATEGIST',
  initialPrompt
}) => {
  const [selectedRole, setSelectedRole] = useState<AiAdvisorRole>(initialRole);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.7-flash');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  const currentRoleConfig = AI_ROLES.find(r => r.id === selectedRole) || AI_ROLES[0];
  const CurrentIcon = currentRoleConfig.icon;

  // Initialize initial greeting when role changes or on open
  useEffect(() => {
    if (isOpen) {
      if (initialPrompt && messages.length === 0) {
        handleSendMessage(initialPrompt);
      } else if (messages.length === 0) {
        setMessages([
          {
            id: `init-${Date.now()}`,
            role: 'model',
            text: `👋 Hello ${currentUser.tgFirstName}! I am your **${currentRoleConfig.name}** for **${activeInstitution?.name || 'Alumni Platform'}**.\n\n${currentRoleConfig.description}\n\nHow can I support your career or academic milestones today?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: selectedModel
          }
        ]);
      }
    }
  }, [isOpen, selectedRole, initialPrompt]);


  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isLoading) return;

    TelegramSdkWrapper.haptic('medium');
    setInputText('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Send conversation history to backend Gemini API
      const historyPayload = newMessages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const data = await safeFetchJson<{ text: string; modelUsed?: string }>('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          role: selectedRole,
          model: selectedModel,
          institutionName: activeInstitution?.name || 'University Alumni Network',
          userContext: {
            name: `${currentUser.tgFirstName} ${currentUser.tgLastName || ''}`.trim(),
            username: currentUser.tgUsername,
            department: profile?.department,
            degreeType: profile?.degreeType,
            jobTitle: profile?.jobTitle,
            company: profile?.company,
            skills: profile?.skills,
            gradYear: profile?.graduationYear
          }
        })
      });

      if (data.success && data.data) {
        const modelMessage: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: data.data.modelUsed || selectedModel
        };
        setMessages(prev => [...prev, modelMessage]);
        TelegramSdkWrapper.haptic('light');
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'model',
            text: `⚠️ Error: ${data.error || 'Unable to connect to Gemini AI service. Please retry.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: '⚠️ Network connection issue. Please check your internet and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClearHistory = () => {
    TelegramSdkWrapper.haptic('light');
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'model',
        text: `🔄 Conversation refreshed. I'm ready to assist as your **${currentRoleConfig.name}**. Ask me any question or pick a prompt below!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel
      }
    ]);
  };

  const handleCopyText = (id: string, text: string) => {
    TelegramSdkWrapper.haptic('light');
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl h-[92vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        {/* Top Header */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between z-20">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-gradient-to-tr ${currentRoleConfig.color} text-white shadow-md`}>
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-100 text-xs sm:text-sm">
                  Gemini Alumni Advisor
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Multi-turn career & mentorship intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearHistory}
              title="Clear conversation"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('light');
                onClose();
              }}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Role & Model Selector Toolbar */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs relative z-10">
          {/* Role Dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => {
                setIsRoleDropdownOpen(!isRoleDropdownOpen);
                setIsModelDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 font-medium text-[11px] transition-all"
            >
              <div className="flex items-center gap-1.5 truncate">
                <CurrentIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{currentRoleConfig.name}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 space-y-1 z-30 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Select Advisor Role
                </div>
                {AI_ROLES.map(r => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedRole(r.id);
                        setIsRoleDropdownOpen(false);
                        TelegramSdkWrapper.haptic('selection');
                        setMessages(prev => [
                          ...prev,
                          {
                            id: `role-switch-${Date.now()}`,
                            role: 'model',
                            text: `🔄 Switched role to **${r.name}**.\n\n${r.description}\n\nHow can I help you in this focus area?`,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            modelUsed: selectedModel
                          }
                        ]);
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-colors ${
                        selectedRole === r.id ? 'bg-blue-600/20 border border-blue-500/40 text-blue-200' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg bg-gradient-to-tr ${r.color} text-white shrink-0 mt-0.5`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs">{r.name}</div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{r.badge}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Model Selector Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setIsModelDropdownOpen(!isModelDropdownOpen);
                setIsRoleDropdownOpen(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 font-mono text-[10px] transition-all"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="font-semibold">{selectedModel.replace('gemini-', '')}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isModelDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 space-y-1 z-30 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Active Model
                </div>
                {AVAILABLE_MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m.id);
                      setIsModelDropdownOpen(false);
                      TelegramSdkWrapper.haptic('selection');
                    }}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      selectedModel === m.id ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{m.name}</span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">{m.tag}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{m.speed}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Thread (Scrollable) */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${currentRoleConfig.color} text-white flex items-center justify-center shrink-0 shadow-md mt-0.5`}>
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-sm shadow-md'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-sm shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {msg.text}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-white/10 text-[9px] opacity-70">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <div className="flex items-center gap-2">
                        {msg.modelUsed && (
                          <span className="font-mono text-[9px]">{msg.modelUsed}</span>
                        )}
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="hover:text-white transition-colors"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-xl bg-slate-700 text-slate-200 flex items-center justify-center shrink-0 shadow-md mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 justify-start animate-pulse">
              <div className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${currentRoleConfig.color} text-white flex items-center justify-center shrink-0`}>
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-slate-800/90 border border-slate-700 p-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1.5 text-[11px]">Analyzing with {selectedModel}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="px-4 py-1.5 bg-slate-900 border-t border-slate-800/80 overflow-x-auto no-scrollbar flex gap-1.5">
          {currentRoleConfig.suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[10px] text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg px-2.5 py-1 whitespace-nowrap shrink-0 transition-colors"
            >
              💡 {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/95 sticky bottom-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={`Ask your ${currentRoleConfig.badge}...`}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
