/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState, useEffect } from "react";
import { 
  ShieldCheck, ArrowRight, Activity, FileText, 
  Settings, MessageSquare, AlertCircle, Sparkles, 
  CheckCircle2, Plus, LogOut, ShieldAlert, HeartPulse 
} from "lucide-react";
import { UserProfile, Claim, PlanId, RiskProfile } from "./types";
import { USER_SCENARIOS, VITARA_PLANS } from "./data";
import OPayContainer from "./components/OPayContainer";
import EnrollmentFlow from "./components/EnrollmentFlow";
import ClaimsFlow from "./components/ClaimsFlow";
import SupportBot from "./components/SupportBot";
import AdminFlow from "./components/AdminFlow";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Scenario selector
  const [selectedScenarioId, setSelectedScenarioId ] = useState<string>("mama_chisom");
  const [activeMiniApp, setActiveMiniApp] = useState<"none" | "vitara">("none");

  // Clock state matching Bento design style (Lagos, Nigeria is GMT+1)
  const [liveTime, setLiveTime] = useState<string>("12:00:00");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Lagos",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setLiveTime(formatter.format(now));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Custom states mapped over multiple users to support switching scenario simulations safely
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [claimsByScenario, setClaimsByScenario] = useState<Record<string, Claim[]>>({});

  // Active Vitara Sub-View state variables
  const [vitaraView, setVitaraView] = useState<"dashboard" | "enroll" | "claims" | "chat">("dashboard");
  const [isAdminPortal, setIsAdminPortal] = useState<boolean>(false);

  // Initialize profiles on startup or changes
  useEffect(() => {
    const initializedProfiles: Record<string, UserProfile> = {};
    const initializedClaims: Record<string, Claim[]> = {};

    USER_SCENARIOS.forEach((scenario) => {
      initializedProfiles[scenario.id] = {
        name: scenario.name,
        phone: scenario.id === "mama_chisom" ? "08032489018" : scenario.id === "seyi_kuti" ? "08092102923" : "08129082348",
        email: `${scenario.id}@gmail.com`,
        opayAccountNumber: scenario.id === "mama_chisom" ? "1090123482" : scenario.id === "seyi_kuti" ? "1090908821" : "1090334810",
        opayBalance: scenario.initialBalance,
        isEnrolled: false,
        activePlan: null,
        enrolledAt: null,
        riskProfile: null,
        historyOfContributions: []
      };

      initializedClaims[scenario.id] = [];
    });

    setProfiles(initializedProfiles);
    setClaimsByScenario(initializedClaims);
  }, []);

  const currentProfile = profiles[selectedScenarioId];
  const currentClaims = claimsByScenario[selectedScenarioId] || [];

  // Handle Scenario switching dynamically
  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setVitaraView("dashboard");
    setIsAdminPortal(false);
  };

  const handleEnrollmentCompletion = (planId: PlanId, riskProfile: RiskProfile, updatedBalance: number) => {
    setProfiles((prev) => {
      const updated = { ...prev };
      updated[selectedScenarioId] = {
        ...updated[selectedScenarioId],
        isEnrolled: true,
        activePlan: planId,
        enrolledAt: new Date().toLocaleDateString(),
        riskProfile: riskProfile,
        opayBalance: updatedBalance,
        historyOfContributions: [
          {
            amount: VITARA_PLANS[planId].premium,
            date: new Date().toLocaleDateString(),
            status: "paid"
          }
        ]
      };
      return updated;
    });

    setVitaraView("dashboard");
  };

  const handleClaimSubmitted = (claim: Claim, revisedOpayBalance: number) => {
    // Add claim to historical list
    setClaimsByScenario((prev) => {
      const updated = { ...prev };
      updated[selectedScenarioId] = [claim, ...(updated[selectedScenarioId] || [])];
      return updated;
    });

    // Revise balance
    setProfiles((prev) => {
      const updated = { ...prev };
      updated[selectedScenarioId] = {
        ...updated[selectedScenarioId],
        opayBalance: revisedOpayBalance
      };
      return updated;
    });
  };

  const handleAdminAuditClaim = (claimId: string, action: 'disbursed' | 'rejected', updateAmount: number) => {
    // Audit logic modifies the targeted claim status across scenarios
    setClaimsByScenario((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((userKey) => {
        updated[userKey] = updated[userKey].map((clm) => {
          if (clm.id === claimId) {
            return {
              ...clm,
              status: action,
              amountApproved: updateAmount
            };
          }
          return clm;
        });
      });
      return updated;
    });

    // If claim was approved/disbursed, increase OPay balance of corresponding profile
    if (action === 'disbursed') {
      // Find which scenario contains this claim ID
      let targetScenarioKey = "";
      Object.entries(claimsByScenario).forEach(([scnKey, clmList]) => {
        if ((clmList as any[]).some(c => c.id === claimId)) {
          targetScenarioKey = scnKey;
        }
      });

      if (targetScenarioKey) {
        setProfiles((prev) => {
          const updated = { ...prev };
          updated[targetScenarioKey] = {
            ...updated[targetScenarioKey],
            opayBalance: updated[targetScenarioKey].opayBalance + updateAmount
          };
          return updated;
        });
      }
    }
  };

  // Safe checks for rendering
  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading Nigerian Micro Insurance Framework...</p>
        </div>
      </div>
    );
  }

  // Underwriting Plan details
  const activePlanMeta = currentProfile.activePlan ? VITARA_PLANS[currentProfile.activePlan] : null;

  return (
    <div id="vitara-app-root" className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row justify-center items-center py-6 px-4 md:px-8 gap-8 relative overflow-x-hidden font-sans">
      
      {/* Subtle Grid overlay simulation */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:16px_16px] opacity-25 -z-15"></div>

      {/* LEFT COLUMN: Visual Bento Grid Dashboard */}
      <div id="vitara-brand-pitch-card" className="max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-4 hidden lg:grid select-none auto-rows-max">
        
        {/* Row 1: Core System Name banner */}
        <div className="col-span-1 md:col-span-2 bg-[#121212] rounded-3xl border border-zinc-800 p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="z-10">
            <span className="bg-[#FF4D00] text-black text-[9px] px-2 py-0.5 font-black uppercase rounded tracking-wider mb-3 inline-block">
              Primary Operation / Microhealth
            </span>
            <h1 className="text-5xl font-black italic uppercase leading-none tracking-tighter text-white">
              VITARA <span className="text-[#FF4D00] font-black underline decoration-4 underline-offset-4 decoration-[#FF4D00]">GO!</span>
            </h1>
            <p className="text-zinc-400 mt-3 text-xs leading-relaxed max-w-md">
              AI-powered microinsurance platform embedded inside OPay. Synthesized safely on our server framework to protect everyday market traders, transit operators, and artisans from catastrophic debt.
            </p>
          </div>
          <div className="flex gap-4 z-10 mt-5 border-t border-zinc-800/80 pt-4 text-[11px]">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-zinc-500 font-bold mb-0.5">Target Cap</span>
              <span className="font-mono text-zinc-300">95M Uninsured</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-zinc-500 font-bold mb-0.5">Disbursement</span>
              <span className="font-mono text-zinc-300">Auto &lt; 2h</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-zinc-500 font-bold mb-0.5">Standard</span>
              <span className="font-mono text-[#FF4D00]">NAICOM Solvent</span>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-6 opacity-5">
            <ShieldCheck className="w-48 h-48 text-white" />
          </div>
        </div>

        {/* Row 2: Live Clock Card */}
        <div className="col-span-1 bg-[#121212] rounded-3xl border border-zinc-800 p-6 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Lagos Terminal</span>
            <div className="w-2 h-2 bg-[#FF4D00] rounded-full animate-ping"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-mono font-black tracking-tight text-white">{liveTime}</span>
            <span className="text-[9px] text-[#FF4D00] font-bold uppercase tracking-widest mt-1">
              GMT +1:00 — Lagos, NG
            </span>
          </div>
        </div>

        {/* Row 2: Solvency Balance Orange Card */}
        <div className="col-span-1 bg-[#FF4D00] text-black rounded-3xl p-6 flex flex-col justify-between h-40 shadow-lg shadow-[#FF4D0022]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider">Operational Solvency</span>
            <span className="text-xs font-mono font-black border border-black/35 px-1.5 py-0.5 rounded">245%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black leading-none uppercase italic">BUFFERS SECURE</span>
            <span className="text-[9px] font-bold uppercase mt-1 opacity-80">
              NAICOM Authorized Reserve PLC
            </span>
          </div>
        </div>

        {/* Row 3: Live Verification Checklist Block */}
        <div className="col-span-1 bg-zinc-100 text-black rounded-3xl p-6 flex flex-col justify-between min-h-[170px] select-none text-[11px]">
          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-2">Verification Checklist</span>
          <div className="flex-1 flex flex-col justify-center gap-2">
            <div className="border-b border-zinc-300 pb-1.5 flex items-center justify-between">
              <span className="font-bold uppercase text-[9px]">Lagos Node Health</span>
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></span>
            </div>
            <div className="border-b border-zinc-300 pb-1.5 flex items-center justify-between">
              <span className="font-bold uppercase text-[9px]">OPay API Connection</span>
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></span>
            </div>
            <div className="border-b border-zinc-300 pb-1.5 flex items-center justify-between">
              <span className="font-bold uppercase text-[9px]">Gemini 2.5 Security</span>
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></span>
            </div>
          </div>
        </div>

        {/* Row 3: Active Operations Node Code */}
        <div className="col-span-1 bg-[#121212] rounded-3xl border border-zinc-800 p-6 flex flex-col justify-between min-h-[170px] border-dashed">
          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">AI Security Protocol</span>
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 bg-[#FF4D00] shadow-[0_0_10px_rgba(255,77,0,0.5)]"></div>
            <div className="flex flex-col">
              <span className="text-md font-mono font-black text-white leading-none">IMMUTABLE OCR</span>
              <span className="text-[9px] text-zinc-500 uppercase mt-1">
                98.4% Precision Rating
              </span>
            </div>
          </div>
          <div className="text-[8px] text-zinc-500 font-mono mt-2 uppercase">
            SECURE RECPTS / HASH_ID_NG44XX
          </div>
        </div>

      </div>

      {/* CENTER COLUMN: The embedded simulated OPay Sandbox Container */}
      <div id="sandbox-container-wrapper" className="shrink-0 relative w-full max-w-sm">
               {/* Toggle between Sandbox client view or Admin operations view */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex items-center bg-[#121212] p-1 rounded-full border border-zinc-800 w-[290px] justify-between z-30 shadow-lg">
          <button
            onClick={() => {
              setIsAdminPortal(false);
              setActiveMiniApp("vitara");
            }}
            className={`flex-1 py-1 px-3 text-[9px] font-black rounded-full uppercase tracking-wider transition ${
              !isAdminPortal ? 'bg-[#FF4D00] text-black shadow-md font-black' : 'text-zinc-500 hover:text-white'
            }`}
          >
            User App Port
          </button>
          <button
            onClick={() => {
              setIsAdminPortal(true);
              setActiveMiniApp("vitara");
            }}
            className={`flex-1 py-1 px-3 text-[9px] font-black rounded-full uppercase tracking-wider transition ${
              isAdminPortal ? 'bg-[#FF4D00] text-black shadow-md font-black' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Underwriter Audit ({currentClaims.filter(c => c.status === "escalated").length})
          </button>
        </div>

        <OPayContainer
          userProfile={currentProfile}
          selectedScenarioId={selectedScenarioId}
          onScenarioChange={handleScenarioChange}
          activeMiniApp={activeMiniApp}
          setActiveMiniApp={setActiveMiniApp}
        >
          {/* RENDER MODULER SUB-VIEWS INSIDE OPay WRAPPER */}

          {isAdminPortal ? (
            // Full Admin portal controls
            <AdminFlow 
              claims={currentClaims} 
              userProfile={currentProfile} 
              onAuditClaim={handleAdminAuditClaim}
            />
          ) : (
            // User Interactive Portal
            <div className="p-4 space-y-4">
              
              {/* Not Enrolled view */}
              {!currentProfile.isEnrolled && vitaraView !== "enroll" ? (
                <div id="unregistered-lead-banner" className="space-y-4 py-4 text-center">
                  <div className="w-14 h-14 bg-[#FF4D00]/10 border border-[#FF4D00]/25 rounded-2xl flex items-center justify-center mx-auto text-[#FF4D00] shadow-[0_0_8px_rgba(255,77,0,0.22)]">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-1.5 max-w-xs mx-auto">
                    <h3 className="font-extrabold text-white text-base tracking-tight leading-tight">Protect Your Trade, Clear Hospital Debts</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Vitara connects everyday OPay users with accredited microinsurance starting at just <strong>₦500/month</strong>. 
                      Complete your quick 3-minute risk audit instantly through safe OPay wallet connection.
                    </p>
                  </div>

                  <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-4 text-left space-y-2 max-w-xs mx-auto select-none">
                    <span className="text-[9px] font-black text-[#FF4D00] uppercase tracking-widest block">How it protects you:</span>
                    <ul className="text-[11px] text-zinc-300 space-y-1.5">
                      <li className="flex items-center gap-2">
                        <span className="text-[#FF4D00] font-bold">●</span>
                        <span>Covers emergencies, surgeries, maternal care</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#FF4D00] font-bold">●</span>
                        <span>OCR instant claiming in under 2 hours</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#FF4D00] font-bold">●</span>
                        <span>Premium paid directly from OPay savings</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    id="launch-enrollment-wizard-btn"
                    onClick={() => setVitaraView("enroll")}
                    className="w-full bg-[#FF4D00] text-black font-black py-3 rounded-xl hover:bg-[#e04300] transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-[#FF4D0022]"
                  >
                    <span>Start 3-Min AI Enrollment</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </button>
                </div>
              ) : null}

              {/* ACTIVE ENROLLMENT FLOW FOR USER */}
              {vitaraView === "enroll" && (
                <EnrollmentFlow
                  scenario={USER_SCENARIOS.find(s => s.id === selectedScenarioId) || USER_SCENARIOS[0]}
                  onComplete={handleEnrollmentCompletion}
                  onCancel={() => setVitaraView("dashboard")}
                />
              )}

              {/* USER ACTIVE INSURANCE DASHBOARD */}
              {currentProfile.isEnrolled && vitaraView === "dashboard" && (
                <div id="enrolled-dashboard-panel" className="space-y-4">
                  {/* Premium subscription info */}
                  <div className="bg-[#121212] text-white p-4 rounded-3xl flex justify-between items-center relative overflow-hidden border border-zinc-800 shadow-md">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF4D00]/5 rounded-full blur-xl"></div>
                    <div>
                      <span className="text-[8px] bg-[#FF4D00]/15 text-[#FF4D00] font-black border border-[#FF4D00]/20 px-2 py-0.5 rounded uppercase tracking-wider">COVER ACTIVE</span>
                      <h4 className="font-black text-sm text-white mt-1.5">{activePlanMeta?.name}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">Premium: ₦{activePlanMeta?.premium.toLocaleString()}/mo (Auto debit)</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-zinc-500 block pb-1 border-b border-zinc-800 uppercase font-mono">Ceiling Cap</span>
                      <strong className="text-lg text-[#FF4D00] font-black block mt-1">₦{activePlanMeta?.coverageLimit.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Dashboard dynamic Quick actions layout */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="launch-claims-btn"
                      onClick={() => setVitaraView("claims")}
                      className="p-3.5 bg-[#121212] border border-zinc-800 text-white rounded-2xl hover:border-zinc-700 transition flex flex-col justify-between h-28 text-left group shadow-sm cursor-pointer"
                    >
                      <div className="p-2 bg-[#FF4D00]/10 border border-[#FF4D00]/20 text-[#FF4D00] rounded-xl shrink-0 inline-block group-hover:bg-[#FF4D00] group-hover:text-black transition">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-xs text-white block group-hover:text-[#FF4D00] transition">File a Claim</strong>
                        <span className="text-[9px] text-zinc-500">Scan hospital invoice</span>
                      </div>
                    </button>

                    <button
                      id="launch-ai-chatbot-btn"
                      onClick={() => setVitaraView("chat")}
                      className="p-3.5 bg-[#121212] border border-zinc-800 text-white rounded-2xl hover:border-zinc-700 transition flex flex-col justify-between h-28 text-left group shadow-sm cursor-pointer"
                    >
                      <div className="p-2 bg-[#FF4D00]/10 border border-[#FF4D00]/20 text-[#FF4D00] rounded-xl shrink-0 inline-block group-hover:bg-[#FF4D00] group-hover:text-black transition">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-xs text-white block group-hover:text-[#FF4D00] transition">AI Local Help</strong>
                        <span className="text-[9px] text-zinc-500">Pidgin/Hausa/Yoruba</span>
                      </div>
                    </button>
                  </div>

                  {/* Previous claims summaries */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Your claim invoices</span>
                    
                    {currentClaims.length === 0 ? (
                      <div className="border border-dashed border-zinc-800 bg-[#0c0c0e] text-zinc-505 text-zinc-500 rounded-3xl p-5 text-center text-xs">
                        No previous claims filed yet. Tap "File a Claim" above to test the Gemini OCR process.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentClaims.slice(0, 3).map((clm) => (
                          <div key={clm.id} className="bg-[#121212] border border-zinc-800 rounded-2xl p-3 flex justify-between items-center text-xs text-white shadow-xs">
                            <div className="space-y-0.5">
                              <span className="font-bold text-white block">{clm.hospitalName}</span>
                              <span className="text-[10px] text-zinc-400">{clm.diagnosis} • {clm.classification}</span>
                            </div>
                            <div className="text-right">
                              <strong className="text-white block font-mono">₦{clm.amountRequested.toLocaleString()}</strong>
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded tracking-wide uppercase ${
                                clm.status === "disbursed" ? "bg-emerald-550/15 text-emerald-400 border border-emerald-500/20" :
                                clm.status === "escalated" ? "bg-[#FF4D00]/15 text-[#FF4D00] border border-[#FF4D00]/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              }`}>
                                {clm.status === "disbursed" ? "Disbursed" : clm.status === "escalated" ? "Pending" : "Rejected"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Settings toggle / Policy details */}
                  <div className="bg-[#121212] rounded-2xl border border-zinc-800 p-3.5 flex items-center justify-between text-xs cursor-not-allowed opacity-70 mt-2 shadow-xs">
                    <div className="flex items-center gap-2 text-zinc-450 text-zinc-405 text-zinc-400">
                      <Settings className="w-4 h-4 text-[#FF4D00]" />
                      <span>Manage recurring OPay authorizations</span>
                    </div>
                    <span className="text-zinc-500 text-[10px] font-bold">SECURE</span>
                  </div>
                </div>
              )}

              {/* DYNAMIC COMPONENT LOADER: CLAIMS HUB WRAPPER */}
              {currentProfile.isEnrolled && vitaraView === "claims" && (
                <ClaimsFlow
                  userProfile={currentProfile}
                  claims={currentClaims}
                  onSubmitClaim={handleClaimSubmitted}
                  onClose={() => setVitaraView("dashboard")}
                />
              )}

              {/* DYNAMIC COMPONENT LOADER: local languages CHAT assistant */}
              {vitaraView === "chat" && (
                <div className="h-[430px] flex flex-col">
                  <div className="flex justify-between items-center pb-2 shrink-0 border-b border-zinc-800">
                    <span className="font-extrabold text-xs text-white uppercase tracking-wider">Support Chat Portal</span>
                    <button id="close-chatbot-btn" onClick={() => setVitaraView("dashboard")} className="text-xs text-[#FF4D00] hover:text-[#e04300] uppercase font-black tracking-wide">Cancel</button>
                  </div>
                  <div className="flex-1 mt-2 overflow-hidden">
                    <SupportBot userProfile={currentProfile} />
                  </div>
                </div>
              )}

              {/* Back to dashboard helpers buttons */}
              {vitaraView !== "dashboard" && vitaraView !== "enroll" && (
                <button
                  id="go-back-dash-btn"
                  onClick={() => setVitaraView("dashboard")}
                  className="w-full mt-4 border border-zinc-800 text-zinc-400 font-bold py-2 rounded-xl hover:bg-[#121212] hover:text-[#FF4D00] text-xs transition uppercase tracking-wider font-mono cursor-pointer"
                >
                  Return to Vitara Hub
                </button>
              )}

            </div>
          )}

        </OPayContainer>
      </div>
    </div>
  );
}
