/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  Activity, Users, Coins, ShieldAlert, FileCheck, 
  Check, X, FileText, AlertCircle, RefreshCw 
} from "lucide-react";
import { Claim, UserProfile } from "../types";
import { motion } from "motion/react";

interface AdminFlowProps {
  claims: Claim[];
  userProfile: UserProfile;
  onAuditClaim: (claimId: string, status: 'disbursed' | 'rejected', updateBalAmt: number) => void;
}

export default function AdminFlow({ claims, userProfile, onAuditClaim }: AdminFlowProps) {
  const [activeTab, setActiveTab ] = useState<'tickets' | 'pool' | 'logs'>('tickets');
  
  // High risk tickets
  const pendingTickets = claims.filter(c => c.status === "escalated");

  // Calculations
  const poolPremiumCollected = userProfile.historyOfContributions.length * 1500; // Mock estimate
  const totalPayouts = claims.filter(c => c.status === "disbursed").reduce((sum, c) => sum + c.amountApproved, 0);
  const activeSubscribedUsers = 127520; // Simulated Nigerian count
  const fraudDeterrenceRate = 98.4; // %

  const handleApproveUnderwrite = (ticket: Claim) => {
    onAuditClaim(ticket.id, 'disbursed', ticket.amountRequested);
  };

  const handleRejectUnderwrite = (ticket: Claim) => {
    onAuditClaim(ticket.id, 'rejected', 0);
  };

  return (
    <div id="admin-underwriter-portal" className="bg-white border border-slate-200 rounded-3xl overflow-hidden text-xs text-slate-700 shadow-sm">
      
      {/* Title */}
      <div className="bg-slate-50 border-b border-slate-200 text-slate-800 px-5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h3 className="font-bold text-xs tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E5E52] animate-pulse"></span>
            <span className="uppercase text-[11px] font-black tracking-wider text-[#1E5E52]">Operational Audit Cockpit</span>
          </h3>
          <p className="text-[9px] text-slate-500 mt-0.5">Insurance regulatory audit standard compliance console (NAICOM authorized portal)</p>
        </div>
        
        <div className="flex flex-wrap gap-1.5 justify-end">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3 py-1.5 rounded uppercase font-black text-[9px] tracking-wider transition cursor-pointer ${
              activeTab === 'tickets' ? 'bg-[#1E5E52] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            Escalated ({pendingTickets.length})
          </button>
          <button
            onClick={() => setActiveTab('pool')}
            className={`px-3 py-1.5 rounded uppercase font-black text-[9px] tracking-wider transition cursor-pointer ${
              activeTab === 'pool' ? 'bg-[#1E5E52] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            Risk Pool
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded uppercase font-black text-[9px] tracking-wider transition cursor-pointer ${
              activeTab === 'logs' ? 'bg-[#1E5E52] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            Claims Logs
          </button>
        </div>
      </div>

      <div className="p-4 font-sans">
        {/* TAB 1: PENDING TICKETS FOR REVIEW */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-black text-slate-800 text-[11px] uppercase tracking-wider">Claims Review Audits</span>
              <span className="text-[8px] text-[#1E5E52] font-black bg-[#EAF2EF] border border-[#1E5E52]/20 px-2 py-0.5 rounded tracking-wider uppercase">
                MANDATE: 24H ACTION
              </span>
            </div>

            {pendingTickets.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-5s bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">All Clear! Zero Escalated Tickets</p>
                <p className="text-[10px] text-slate-500">Low-risk claims submitted by users are processed 100% instantly by the Gemini OCR agent.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {pendingTickets.map((tc) => (
                  <div key={tc.id} className="bg-white rounded-2xl border border-slate-205 border-slate-200 p-4 space-y-3 relative shadow-xs hover:border-slate-300 transition text-slate-700">
                    <div className="flex justify-between items-start border-b border-slate-150 pb-2">
                      <div>
                        <span className="text-[8px] bg-slate-50 border border-slate-200 font-black px-2 py-0.5 rounded uppercase tracking-wider text-slate-500">{tc.classification}</span>
                        <h4 className="font-extrabold text-slate-850 text-slate-800 text-xs mt-1.5 tracking-tight">{tc.hospitalName}</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5">Claimant: <strong className="text-slate-700">{tc.patientName}</strong> • Patient ID: {tc.payoutWallet}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[#1E5E52] font-black block font-mono">₦{tc.amountRequested.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-400 block font-mono">RefId: {tc.claimId}</span>
                      </div>
                    </div>

                    {/* Technical analysis details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 space-y-1">
                        <strong className="text-slate-800 text-[9px] uppercase tracking-wider block">Diagnoses Indication</strong>
                        <p className="text-slate-600 font-medium">{tc.diagnosis}</p>
                      </div>

                      <div className="bg-[#FAF5F2] border border-amber-100 rounded-xl p-2.5 space-y-1 md:col-span-2">
                        <div className="flex items-center gap-1 font-black text-amber-800 text-[9px] uppercase tracking-wider">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                          <span>Gemini AI Integrity Anomaly Report:</span>
                        </div>
                        <p className="text-amber-900 italic font-medium">
                          "{tc.fraudAlerts?.reason || "Irregular invoice digit placement and outlier cost parameters flagged."}"
                        </p>
                      </div>
                    </div>

                    {/* OCR Lists review */}
                    {tc.ocrExtractedData?.items && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-[10px] mt-2 font-mono">
                        <strong className="text-[8px] text-slate-500 uppercase tracking-wider block mb-1">OCR Item Detailed Analysis:</strong>
                        <div className="divide-y divide-slate-150 font-mono">
                          {tc.ocrExtractedData.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between py-1 text-slate-600 font-mono">
                              <span>• {it.description}</span>
                              <strong className="text-slate-800">₦{it.cost.toLocaleString()}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Operational audit buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-150 mt-2">
                      <button
                        onClick={() => handleRejectUnderwrite(tc)}
                        className="bg-white border border-slate-205 border-slate-200 text-slate-500 hover:text-rose-650 hover:text-rose-600 hover:bg-[#FAF3F3] px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>REJECT</span>
                      </button>
                      <button
                        onClick={() => handleApproveUnderwrite(tc)}
                        className="bg-[#1E5E52] text-white hover:bg-[#164E43] px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>APPROVE DISBURSEMENT</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RISK POOL METRICS */}
        {activeTab === 'pool' && (
          <div className="space-y-4 text-slate-705 text-slate-700">
            <span className="font-black text-slate-800 text-[11px] uppercase tracking-wider block border-b border-slate-200 pb-2">Risk Pool Metric Indexes</span>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1 hover:border-slate-300 transition">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">ACTIVE NIGERIAN MEMBERS</span>
                <span className="text-lg font-mono font-black text-slate-800 block">{(activeSubscribedUsers).toLocaleString()}</span>
                <span className="text-[8px] text-[#1E5E52] font-semibold block uppercase font-mono">↑ 12% MONTHLY</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1 hover:border-slate-300 transition">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">POOL PREMIUM VOLUME INC</span>
                <span className="text-lg font-mono font-black text-slate-800 block">₦{(poolPremiumCollected + 643033500).toLocaleString()}</span>
                <span className="text-[8px] text-slate-400 block uppercase font-mono">Accumulated over 18 mos</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1 hover:border-slate-300 transition">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">APPROVED CLAIMS DISBURSED</span>
                <span className="text-lg font-mono font-black text-[#1E5E52] block">₦{(totalPayouts + 12053000).toLocaleString()}</span>
                <span className="text-[8px] text-slate-400 block uppercase font-mono">Average payout: ~₦42,000</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1 hover:border-slate-300 transition">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">FRAUD DETERRENCE COEFFICIENT</span>
                <span className="text-lg font-mono font-black text-slate-800 block">{fraudDeterrenceRate}%</span>
                <span className="text-[8px] text-slate-400 block uppercase font-mono">AI saves ₦8.2M annually</span>
              </div>
            </div>

            {/* Regulatory and underwriting policies */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3">
              <h5 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider font-mono">National Health Insurance Authority (NHIA) Integration Standard Documentation</h5>
              <p className="text-slate-655 text-slate-600 leading-relaxed text-[11px]">
                Under Section 21 of the NHIA act, Vitara as a recognized microinsurance facilitator operates as a decentralized microhealth agency in partnership with NAICOM underwriters. 
                Capital solvency buffers must exceed 150% of outstanding quarterly reserves. The current calculated solvency ratio stands at <strong className="text-[#1E5E52]">245%</strong>, ensuring perfect premium payout stability.
              </p>
              
              <div className="border-t border-slate-200 pt-3 mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] text-slate-500">
                <div className="flex items-start gap-2">
                  <span className="text-[#1E5E52] text-xs font-black">✔</span>
                  <span><strong>Weekly Fraud Audits:</strong> Complete database query validation of all OPay transactions ensures zero internal credit pooling loops.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#1E5E52] text-xs font-black">✔</span>
                  <span><strong>Underwriter catastrophic buffer:</strong> NAICOM partner (Licensed Insurance PLC) holds full legal insurance coverage above the ₦500,000 claim floor.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2">
              <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Immutable NDPR Compliance Security Audit Trails</span>
              <span className="text-[9px] text-slate-400 font-mono text-right font-black">ALL STEPS ENCRYPTED</span>
            </div>

            <div className="bg-slate-50 text-slate-600 border border-slate-200 p-3.5 rounded-2xl font-mono text-[9px] space-y-2 overflow-x-auto max-h-[280px]">
              <p className="text-slate-400">[SYSTEM] 2026-06-14T00:35:05Z - Vitara node initialized with SERVER_SIDE_GEMINI_API capability.</p>
              <p className="text-slate-400">[AUDIT] 2026-06-14T00:35:12Z - Secure token payload injected via Settings panel. NDPR encryption flags checked: PASS.</p>
              <p className="text-[#1E5E52] font-black">[RESERVE] 2026-06-14T00:35:30Z - Calculated monthly underwrite pool solvency buffer tier: ₦643,033,500 reserves held.</p>
              <p className="text-slate-400">[AI_API] 2026-06-14T00:36:43Z - Underwriting score engine mounted. Prompting pattern: gemini-3.5-flash with applicationMime JSON schema standard.</p>
              
              {claims.length > 0 ? (
                claims.map((c, idx) => (
                  <p key={idx} className="text-slate-600">
                    [INSURANCE] {new Date(c.submittedAt).toISOString()} - Claim Ref: {c.claimId} submitted | Diagnoses: {c.diagnosis} | Amount: ₦{c.amountRequested.toLocaleString()} | Status: {c.status.toUpperCase()}
                  </p>
                ))
              ) : (
                <p className="text-slate-400">// Waiting for claim actions before documenting dynamic billing trails...</p>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
