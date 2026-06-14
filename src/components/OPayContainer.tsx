/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ArrowLeftRight, Phone, Lightbulb, CreditCard, 
  Eye, EyeOff, QrCode, Bell, User, HelpCircle, 
  ChevronRight, Sparkles, TrendingUp, ShieldCheck 
} from "lucide-react";
import { OPayTransaction, UserProfile } from "../types";
import { MockUserProfileScenario, USER_SCENARIOS } from "../data";
import { motion } from "motion/react";

interface OPayContainerProps {
  userProfile: UserProfile;
  selectedScenarioId: string;
  onScenarioChange: (scenarioId: string) => void;
  children: React.ReactNode;
  activeMiniApp: "none" | "vitara";
  setActiveMiniApp: (mode: "none" | "vitara") => void;
}

export default function OPayContainer({ 
  userProfile, 
  selectedScenarioId, 
  onScenarioChange, 
  children, 
  activeMiniApp, 
  setActiveMiniApp 
}: OPayContainerProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "rewards" | "finance" | "me">("home");

  const currentScenario = USER_SCENARIOS.find(s => s.id === selectedScenarioId) || USER_SCENARIOS[0];

  return (
    <div id="opay-wallet-container" className="max-w-md mx-auto bg-[#050505] min-h-[780px] rounded-3xl shadow-2xl overflow-hidden border-8 border-zinc-805 border-zinc-800 flex flex-col font-sans relative">
      
      {/* OS Status bar simulation */}
      <div className="bg-[#121212] border-b border-zinc-850 px-5 pt-2 pb-1.5 flex justify-between items-center text-white/90 text-[10px] font-semibold tracking-wider select-none font-mono">
        <span className="text-zinc-400">VITARA OS 4.0</span>
        <div className="flex items-center gap-1.5 text-zinc-455 text-zinc-400">
          <span className="text-[#1E5E52] font-black">● SIM ACTIVE</span>
          <span>100% [🔋]</span>
        </div>
      </div>

      {/* Mini App Overlay wrapper */}
      {activeMiniApp === "vitara" ? (
        <div className="flex-1 bg-[#F5F8F7] flex flex-col relative overflow-hidden text-slate-800">
          {/* Header standard in OPay Embedded Applet */}
          <div className="bg-white text-slate-800 px-4 py-3.5 flex items-center justify-between shadow-xs shrink-0 border-b border-[#E4EBE8]">
            <button
              id="back-to-opay-wallet-btn"
              onClick={() => setActiveMiniApp("none")}
              className="flex items-center gap-1 text-slate-500 hover:text-[#1E5E52] font-bold text-xs uppercase tracking-wider transition"
            >
              <ChevronRight className="w-4 h-4 transform rotate-180 text-[#1E5E52]" />
              <span>OPay</span>
            </button>
            <div className="text-center font-sans">
              <span className="text-[9px] bg-[#EAF2EF] text-[#1E5E52] font-black tracking-widest px-2.5 py-1 rounded-lg uppercase border border-[#1E5E52]/10">VITARA CARE</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SECURED</span>
            </div>
          </div>

          {/* Render actual Vitara interface inside */}
          <div className="flex-1 overflow-y-auto bg-[#F5F8F7]">
            {children}
          </div>
        </div>
      ) : (
        // Standard OPay App Layout
        <div className="flex-1 bg-slate-50 flex flex-col justify-between">
          
          {/* TOP BAR */}
          <div>
            <div className="bg-emerald-800 text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700 border border-emerald-500 flex items-center justify-center text-lg select-none">
                  {currentScenario.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white select-none">{userProfile.name}</span>
                    <span className="text-[9px] bg-emerald-600 px-1.5 py-0.5 rounded text-white font-bold">OPay Pro</span>
                  </div>
                  <span className="text-[10px] text-emerald-205 text-emerald-100 block mt-0.5">Wallet Id: {userProfile.opayAccountNumber}</span>
                </div>
              </div>

              {/* Scenario quick selector drop down */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-200 hidden sm:inline">Active User:</span>
                <select
                  id="target-user-profile-selector"
                  value={selectedScenarioId}
                  onChange={(e) => onScenarioChange(e.target.value)}
                  className="bg-emerald-900 border border-emerald-600 text-white rounded text-[10px] px-1 py-1 focus:outline-none"
                >
                  {USER_SCENARIOS.map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-800 bg-white">{s.name} ({s.occupation})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* WALLET BALANCE CARD */}
            <div className="bg-emerald-800 text-white px-5 pb-5 shrink-0 rounded-b-3xl shadow-md space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-200 text-xs">
                    <span>OPay Account Balance</span>
                    <button id="toggle-balance-vis-btn" onClick={() => setShowBalance(!showBalance)} className="hover:text-white">
                      {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-2xl font-black tracking-tight select-none">
                    {showBalance ? `₦${userProfile.opayBalance.toLocaleString()}` : "₦ ••••••••"}
                  </div>
                </div>

                <div className="p-2 bg-emerald-700/60 rounded-full text-emerald-300">
                  <QrCode className="w-5 h-5" />
                </div>
              </div>

              {/* Transactions actions */}
              <div className="bg-emerald-900/50 rounded-2xl p-3 flex justify-around text-center text-xs">
                <div className="space-y-1 text-emerald-100 cursor-pointer hover:text-white">
                  <div className="w-10 h-10 bg-emerald-700/80 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <ArrowLeftRight className="w-4 h-4 text-emerald-250 text-emerald-200" />
                  </div>
                  <span className="text-[10px]">Send Money</span>
                </div>
                <div className="space-y-1 text-emerald-100 cursor-pointer hover:text-white">
                  <div className="w-10 h-10 bg-emerald-700/80 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <ChevronRight className="w-4 h-4 transform rotate-90 text-emerald-200" />
                  </div>
                  <span className="text-[10px]">Receipts</span>
                </div>
                <div className="space-y-1 text-emerald-100 cursor-pointer hover:text-white">
                  <div className="w-10 h-10 bg-emerald-700/80 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <Phone className="w-4 h-4 text-emerald-200" />
                  </div>
                  <span className="text-[10px]">Airtime / Data</span>
                </div>
                <div className="space-y-1 text-emerald-100 cursor-pointer hover:text-white">
                  <div className="w-10 h-10 bg-emerald-700/80 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <Lightbulb className="w-4 h-4 text-emerald-200" />
                  </div>
                  <span className="text-[10px]">Pay Bills</span>
                </div>
              </div>
            </div>

            {/* SERVICES RAIL GRID */}
            <div className="p-4 space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-xs space-y-3">
                <span className="font-extrabold text-slate-800 text-[11px] tracking-wider uppercase">OPay Smart Finance</span>
                
                <div className="grid grid-cols-4 gap-3 text-center text-[10px]">
                  <div className="space-y-1 opacity-60">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">🏦</div>
                    <span className="text-slate-650 font-semibold block">O-Wealth</span>
                  </div>
                  <div className="space-y-1 opacity-60">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">💳</div>
                    <span className="text-slate-650 font-semibold block">Salary Card</span>
                  </div>
                  <div className="space-y-1 opacity-60">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">📈</div>
                    <span className="text-slate-650 font-semibold block">Investments</span>
                  </div>

                  {/* ACTIVE VITARA INSURANCE TILE */}
                  <div 
                    id="vitara-health-tile-btn"
                    onClick={() => setActiveMiniApp("vitara")}
                    className="space-y-1 hover:scale-105 transition cursor-pointer relative group"
                  >
                    <span className="absolute -top-1.5 -right-1.5 bg-[#1E5E52] text-[8px] font-black text-white px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                      CARE GO!
                    </span>
                    <div className="w-10 h-10 bg-white border-2 border-[#1E5E52] text-[#1E5E52] rounded-xl flex items-center justify-center mx-auto shadow-sm relative group-hover:bg-[#1E5E52] group-hover:text-white transition">
                      <ShieldCheck className="w-5 h-5 text-[#1E5E52] group-hover:text-white transition" />
                    </div>
                    <span className="text-slate-850 font-black block tracking-tight text-[10px]">Vitara Care</span>
                  </div>
                </div>
              </div>

              {/* Recent simulation activities */}
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b pb-2 border-slate-100">
                  <span className="font-extrabold text-slate-800 text-[11px] tracking-wider uppercase">Vulnerable Nigerians Safety Spotlight</span>
                </div>
                
                <div className="rounded-lg bg-emerald-50/55 p-3 flex gap-2.5 items-start text-[11px] text-emerald-950 border border-emerald-105">
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>95 Million Nigerians</strong> wake up everyday without any active healthcare security buffers. Tap into <strong>Vitara Health</strong> above to register microinsurance starting at just <strong>₦500/month</strong>, protecting your market trades from emergency collapse.
                  </p>
                </div>
              </div>

              {/* Transactions audit logs inside OPay */}
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                <span className="font-extrabold text-slate-800 text-[11px] tracking-wider uppercase block">OPay Ledger Card Activities</span>
                <div className="divide-y divide-slate-100 max-h-[160px] overflow-y-auto">
                  {currentScenario.transactions.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 text-[11px]">
                      <div>
                        <strong className="text-slate-705 text-slate-700 block">{t.description}</strong>
                        <span className="text-[9px] text-slate-400">{t.date} • {t.type}</span>
                      </div>
                      <div className="text-right">
                        <strong className={`font-bold ${t.type === 'deposit' ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {t.type === 'deposit' ? '+' : '-'} ₦{t.amount.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM NAVIGATION SIMULATION */}
          <div className="bg-white border-t border-slate-200 px-5 py-2.5 flex justify-between text-center text-[10px] text-slate-400 shrink-0 select-none">
            <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center gap-1 ${activeTab === "home" ? "text-emerald-600 font-bold" : ""}`}>
              <span className="text-sm">🏠</span>
              <span>Home</span>
            </button>
            <button onClick={() => setActiveTab("rewards")} className={`flex flex-col items-center gap-1 ${activeTab === "rewards" ? "text-emerald-600 font-bold" : ""}`}>
              <span className="text-sm">🎁</span>
              <span>Rewards</span>
            </button>
            <button 
              onClick={() => setActiveMiniApp("vitara")}
              className="flex flex-col items-center gap-1 text-emerald-600 font-bold"
            >
              <span className="p-1.5 bg-emerald-600 rounded-full text-white text-xs -mt-5 shadow-md">🛡️</span>
              <span>Vitara</span>
            </button>
            <button onClick={() => setActiveTab("finance")} className={`flex flex-col items-center gap-1 ${activeTab === "finance" ? "text-emerald-600 font-bold" : ""}`}>
              <span className="text-sm">🏦</span>
              <span>Finance</span>
            </button>
            <button onClick={() => setActiveTab("me")} className={`flex flex-col items-center gap-1 ${activeTab === "me" ? "text-emerald-600 font-bold" : ""}`}>
              <span className="text-sm">👤</span>
              <span>Me</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
