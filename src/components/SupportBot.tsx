/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Globe, Sparkles } from "lucide-react";
import { SupportMessage, NigeriaLanguage, UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SupportBotProps {
  userProfile: UserProfile | null;
  onClose?: () => void;
}

const LANGUAGE_LABELS: Record<NigeriaLanguage, string> = {
  en: "English (Standard)",
  pidgin: "Naija Pidgin 🇳🇬",
  yoruba: "Yoruba 🇳🇬",
  hausa: "Hausa 🇳🇬",
  igbo: "Igbo 🇳🇬"
};

const SUGGESTED_QUESTIONS = [
  "What does Foundation plan cover?",
  "How can I submit a claim receipt?",
  "How long do payouts take?",
  "Is Vitara licensed?"
];

export default function SupportBot({ userProfile, onClose }: SupportBotProps) {
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: "welcome",
      role: "model",
      content: "Hello! Welcome to Vitara Support. How can I help you protect your family on OPay today?\nHow I fit help you today, abeg feel free to ask me anything!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMsg, setInputMsg ] = useState("");
  const [language, setLanguage] = useState<NigeriaLanguage>("en");
  const [isLoading, setIsLoading] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: SupportMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMsg("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          selectedLanguage: language,
          userProfile: userProfile
        })
      });

      if (!response.ok) {
        throw new Error("Chat service returned an error.");
      }

      const data = await response.json();
      
      const botResponse: SupportMessage = {
        id: `msg_${Date.now() + 1}`,
        role: "model",
        content: data.reply || "I'm having trouble responding right now. Abeg try again soon.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      console.error(err);
      const errorMsg: SupportMessage = {
        id: `msg_err_${Date.now()}`,
        role: "model",
        content: "Oyo! Network connection issue. Please check your OPay details or try again shortly. No wahala, we are here.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="vitara-support-bot" className="flex flex-col h-full bg-[#F5F8F7] relative rounded-2xl overflow-hidden border border-[#E2EBE8] shadow-xs">
      {/* Header */}
      <div className="bg-white border-b border-[#E2EBE8] px-4 py-3 flex text-slate-800 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#EAF2EF] border border-[#1E5E52]/20 rounded-full">
            <Bot className="w-4 h-4 text-[#1E5E52]" />
          </div>
          <div>
            <h4 className="font-extrabold text-[10.5px] uppercase tracking-wider text-slate-800">Vitara Care Assistant</h4>
            <span className="text-[9px] text-[#1E5E52] flex items-center gap-1 font-mono uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ACTIVE HEALTH CHECK • SECURED
            </span>
          </div>
        </div>

        {/* Language Selector */}
        <div className="relative">
          <button
            id="lang-selector-btn"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-650 text-[9.5px] font-mono uppercase px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{language.toUpperCase()}</span>
          </button>

          <AnimatePresence>
            {isLangOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-40 p-1 text-[11px]"
              >
                {Object.entries(LANGUAGE_LABELS).map(([langKey, label]) => (
                  <button
                    key={langKey}
                    onClick={() => {
                      setLanguage(langKey as NigeriaLanguage);
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition uppercase tracking-wide text-[9.5px] font-mono cursor-pointer ${
                      language === langKey ? "font-black text-[#1E5E52] bg-[#EAF2EF]" : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-none bg-[#F5F8F7]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 max-w-[85%] ${
              m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border text-xs ${
                m.role === "user"
                  ? "bg-white border-slate-250 text-slate-500"
                  : "bg-[#EAF2EF] border-[#1E5E52]/20 text-[#1E5E52]"
              }`}
            >
              {m.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div className="flex flex-col">
              <div
                className={`px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed font-sans ${
                  m.role === "user"
                    ? "bg-[#1E5E52] text-white rounded-tr-none font-semibold"
                    : "bg-white text-slate-705 text-slate-700 border border-[#E2EBE8] rounded-tl-none relative shadow-xs"
                }`}
              >
                <p className="whitespace-pre-line">{m.content}</p>
                {m.role === "model" && m.id === "welcome" && (
                  <div className="mt-2 text-[9px] text-[#1E5E52] font-mono uppercase tracking-wide">
                    🍀 Tip: Speak Pidgin if you prefer, I understand perfectly!
                  </div>
                )}
              </div>
              <span className="text-[8px] font-mono text-slate-400 mt-1 self-end uppercase">
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 max-w-[80%] mr-auto items-center">
            <div className="w-7 h-7 rounded-xl bg-[#EAF2EF] border border-[#1E5E52]/20 text-[#1E5E52] flex items-center justify-center">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-[#E2EBE8] rounded-2xl rounded-tl-none px-3.5 py-2.5 text-slate-500 shadow-xs flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-[#1E5E52] animate-spin" />
              <span className="font-mono uppercase text-[9px] tracking-wider text-slate-400">Reviewing policy guidelines...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested Questions */}
      <div className="px-4 py-2 border-t border-[#E2EBE8] bg-white flex flex-wrap gap-1.5">
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleSendMessage(q)}
            className="text-[9.5px] font-mono uppercase text-slate-600 bg-slate-50 hover:bg-[#EAF2EF] hover:text-[#1E5E52] border border-slate-200 px-2.5 py-1 rounded-lg transition max-w-full text-ellipsis overflow-hidden whitespace-nowrap disabled:opacity-50 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#E2EBE8] bg-white flex items-center gap-2">
        <input
          type="text"
          value={inputMsg}
          disabled={isLoading}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage(inputMsg);
          }}
          placeholder="Ask Vitara Care about claims, coverage..."
          className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#1E5E52]/40 bg-slate-50 text-slate-800 font-sans focus:bg-white placeholder-slate-400"
        />
        <button
          id="send-msg-btn"
          disabled={!inputMsg.trim() || isLoading}
          onClick={() => handleSendMessage(inputMsg)}
          className="bg-[#1E5E52] text-white p-2.5 rounded-xl hover:bg-[#164E43] transition flex items-center justify-center disabled:opacity-30 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
