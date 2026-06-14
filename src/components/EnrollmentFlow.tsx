/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  ShieldCheck, Check, Scan, Clock, 
  CheckCircle, AlertCircle, ArrowRight 
} from "lucide-react";
import { UserProfile, PlanId, RiskProfile, InsurancePlan } from "../types";
import { VITARA_PLANS, MockUserProfileScenario } from "../data";
import { motion } from "motion/react";

interface EnrollmentFlowProps {
  scenario: MockUserProfileScenario;
  onComplete: (planId: PlanId, riskProfile: RiskProfile, updatedBalance: number) => void;
  onCancel: () => void;
}

export default function EnrollmentFlow({ scenario, onComplete, onCancel }: EnrollmentFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [selectedPlanId, setSelectedPlanId ] = useState<PlanId>(PlanId.HEALTH);
  const [errorText, setErrorText] = useState("");

  // Step 1: Start & Request Consent
  const handleStartAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisProgress(10);
    setErrorText("");

    // Simulate analysis steps visually for 2.5 seconds
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 500);

    try {
      const response = await fetch("/api/gemini/risk-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: scenario.transactions,
          userAnswers: scenario.surveyAnswers
        })
      });

      clearInterval(interval);
      setAnalysisProgress(100);

      if (!response.ok) {
        throw new Error("Failed to evaluate risk score.");
      }

      const data = await response.json();
      setRiskProfile(data);
      setSelectedPlanId(data.recommendedPlan || PlanId.FOUNDATION);
      setTimeout(() => {
        setAnalyzing(false);
        setStep(2); // Move to analysis results
      }, 300);

    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setErrorText("Gemini underwriting experienced latency. Utilizing standard offline risk assessor.");
      
      // Fallback
      setTimeout(() => {
        const fallbackRisk: RiskProfile = {
          score: scenario.id === "mama_chisom" ? 64 : scenario.id === "seyi_kuti" ? 48 : 88,
          grade: scenario.id === "mama_chisom" ? "C" : scenario.id === "seyi_kuti" ? "D" : "A",
          recommendedPlan: scenario.id === "mama_chisom" ? PlanId.FOUNDATION : scenario.id === "seyi_kuti" ? PlanId.PREMIER : PlanId.HEALTH,
          analysisReason: `Analyzed ${scenario.transactions.length} OPay transacts. Out-of-pocket margin calculated. Reaffirming standard risk tier for occupational field: ${scenario.occupation}.`,
          indicators: {
            incomeStability: scenario.id === "amaka_okafor" ? "High" : "Medium",
            spendingDiscipline: "Medium",
            savingBuffer: scenario.id === "amaka_okafor" ? "High" : "Low",
            healthExposure: scenario.id === "seyi_kuti" ? "High" : "Medium"
          }
        };
        setRiskProfile(fallbackRisk);
        setSelectedPlanId(fallbackRisk.recommendedPlan);
        setAnalyzing(false);
        setStep(2);
      }, 1000);
    }
  };

  const handleConfirmPlan = () => {
    setStep(3); // Go to authorization terms
  };

  const handleFinalEnroll = () => {
    if (!riskProfile) return;
    const premiumCost = VITARA_PLANS[selectedPlanId].premium;
    const currentBalance = scenario.initialBalance;

    if (currentBalance < premiumCost) {
      setErrorText(`Insufficient OPay balance (₦${currentBalance.toLocaleString()}) to pay the initial premium of ₦${premiumCost}. Please fund wallet or choose lower plan.`);
      setStep(2);
      return;
    }

    setStep(4); // Enrollment Completed Success Screen
    setTimeout(() => {
      onComplete(selectedPlanId, riskProfile, currentBalance - premiumCost);
    }, 2800);
  };

  return (
    <div id="enrollment-flow-wizard" className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-200 max-w-2xl mx-auto flex flex-col min-h-[460px] shadow-sm">
      
      {/* Step Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-slate-150 pb-4 gap-3">
        <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#1E5E52]" />
          <span className="uppercase text-[11px] font-black tracking-wider">3-Min Care Enrollment</span>
        </h3>
        <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-black uppercase tracking-wider font-mono">
          <span className={`px-2.5 py-1 rounded-md border transition ${step === 1 ? "bg-[#1E5E52] text-white border-[#1E5E52]" : "bg-slate-50 border-slate-200 text-slate-400"}`}>1. Risk Score</span>
          <span className={`px-2.5 py-1 rounded-md border transition ${step === 2 ? "bg-[#1E5E52] text-white border-[#1E5E52]" : "bg-slate-50 border-slate-200 text-slate-400"}`}>2. Plan Match</span>
          <span className={`px-2.5 py-1 rounded-md border transition ${step === 3 ? "bg-[#1E5E52] text-white border-[#1E5E52]" : "bg-slate-50 border-slate-200 text-slate-400"}`}>3. Authorize</span>
        </div>
      </div>

      {/* STEP 1: Consent and analysis launching */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="bg-[#EAF2EF] rounded-2xl p-4 border border-[#1E5E52]/10 text-xs text-slate-700 space-y-2">
              <p className="font-black text-[#1E5E52] uppercase text-[9px] tracking-wider">Why we need transaction consent:</p>
              <ul className="list-disc list-inside space-y-1 text-xs opacity-90 leading-relaxed font-sans">
                <li>Underwrites premiums instantly without heavy document filing</li>
                <li>Assigns fair Health Risk scores linked to actual OPay buffers</li>
                <li>Eliminates human medical exams or lengthy agent waiting lines</li>
              </ul>
            </div>

            <div className="border border-slate-200 bg-slate-50/70 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{scenario.avatar}</span>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-tight">{scenario.name} • {scenario.occupation}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Verifying OPay account: {scenario.surveyAnswers.dependents} dependents listed</p>
                </div>
              </div>
              
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-650 font-mono">
                <p><strong>Age bracket:</strong> {scenario.surveyAnswers.ageBracket}</p>
                <p><strong>Pre-existing indications:</strong> {scenario.surveyAnswers.hasPreExisting}</p>
                <p><strong>Logs mapped:</strong> {scenario.transactions.length} mobile cash transfers inside OPay</p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[10px] text-slate-550 leading-relaxed pt-1">
              <ShieldCheck className="w-4 h-4 text-[#1E5E52] shrink-0 mt-0.5" />
              <span>By ticking below, you grant OPay license to pass anonymous transaction counts, receipt values and cashflow stability to Gemini AI safely. We strictly comply with Nigeria Data Protection Regulation (NDPR) criteria.</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-150 flex gap-3 justify-end items-center mt-4">
            <button 
              id="cancel-consent-btn"
              onClick={onCancel}
              className="text-[10px] uppercase font-black tracking-wider text-slate-400 hover:text-slate-705 px-4 py-2 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="start-underwriting-btn"
              onClick={handleStartAnalysis}
              disabled={analyzing}
              className="bg-[#1E5E52] text-white font-black text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#164E43] transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>{analyzing ? "Analyzing logs..." : "Consent & Run AI Assessment"}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Screening Overlay */}
          {analyzing && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 rounded-3xl">
              <div className="bg-[#F5F8F7] border border-[#E2EBE8] rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-[#1E5E52] animate-spin mx-auto flex items-center justify-center">
                    <Scan className="w-6 h-6 text-[#1E5E52] animate-pulse" />
                  </div>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 uppercase text-xs tracking-wider">Underwriting Risk Score...</h4>
                  <p className="text-[10px] text-slate-550 mt-1 leading-relaxed">Analyzing OPay trade patterns, spending categories, and buffer thresholds.</p>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#1E5E52]. h-full rounded-full transition-all duration-305 bg-[#1E5E52]" 
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-black font-mono text-[#1E5E52]">{analysisProgress}% Complete</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Underwriting Analysis Output & Plan Configuration */}
      {step === 2 && riskProfile && (
        <div className="flex-1 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* AI Custom Header Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                <span className="text-[8px] text-slate-500 font-black tracking-widest uppercase">RISK ASSESSMENT SCORE</span>
                <span className="text-4xl font-mono font-black text-[#1E5E52] mt-1">{riskProfile.score}</span>
                <span className="text-[9px] bg-[#EAF2EF] border border-[#1E5E52]/20 text-[#1E5E52] px-2.5 py-1 rounded-md mt-2 font-black uppercase tracking-wider font-mono">
                  Grade {riskProfile.grade} Match
                </span>
              </div>

              <div className="col-span-2 border border-slate-200 rounded-2xl p-3.5 bg-slate-50/70 text-xs space-y-2">
                <p className="font-extrabold text-slate-800 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-[#1E5E52]" />
                  <span>AI Policy Recommendation:</span>
                </p>
                <p className="text-slate-650 text-slate-600 leading-relaxed italic">
                  "{riskProfile.analysisReason}"
                </p>
                
                {/* Specific ratings indicators */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-[9px] font-mono">
                  <div>
                    <span className="text-slate-400 block uppercase">Income stability</span>
                    <strong className="text-slate-700">{riskProfile.indicators.incomeStability}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase">Spending discipline</span>
                    <strong className="text-slate-700">{riskProfile.indicators.spendingDiscipline}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase">Saving buffer</span>
                    <strong className="text-slate-700">{riskProfile.indicators.savingBuffer}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase">Health exposure</span>
                    <span className={`font-bold uppercase ${riskProfile.indicators.healthExposure === 'High' ? 'text-rose-600' : 'text-slate-700'}`}>
                      {riskProfile.indicators.healthExposure}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan selector comparison card */}
            <div className="space-y-2.5 pt-1.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Compare & Choose Plan:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.values(VITARA_PLANS).map((p: InsurancePlan) => {
                  const isRecommended = riskProfile.recommendedPlan === p.id;
                  const isSelected = selectedPlanId === p.id;
                  
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`border p-3.5 rounded-2xl cursor-pointer transition flex flex-col justify-between relative ${
                        isSelected 
                          ? "border-[#1E5E52] bg-[#EAF2EF]/30 shadow-xs" 
                          : "border-slate-200 bg-white hover:border-slate-355 hover:border-slate-300 hover:bg-slate-50/30"
                      }`}
                    >
                      {isRecommended && (
                        <span className="absolute -top-2 left-3 bg-[#1E5E52] text-[7px] font-mono font-black text-white px-2.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
                          Recommended
                        </span>
                      )}
                      <div>
                        <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                          {p.name}
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#1E5E52] shrink-0 font-extrabold" />}
                        </h5>
                        <p className="text-[10px] text-slate-500 mt-1 min-h-[36px] line-clamp-3 leading-normal">{p.description}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-150 font-mono">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400">Premium</span>
                        <div className="text-sm font-mono font-black text-slate-800 mt-0.5 animate-none">
                          ₦{p.premium.toLocaleString()}<span className="text-[10px] font-medium text-slate-400"> / month</span>
                        </div>
                        <div className="text-[9px] text-[#1E5E52] font-black mt-1 font-mono uppercase">
                          Ceiling: ₦{p.coverageLimit.toLocaleString()} / year
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {errorText && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-[10px] uppercase font-bold tracking-wider text-rose-700 rounded-xl flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-150 flex justify-between items-center text-xs font-sans mt-3">
            <span className="text-slate-500 text-[11px]">
              Selected plan Premium: <strong className="text-slate-800 font-bold">₦{VITARA_PLANS[selectedPlanId].premium}/month</strong>
            </span>
            <div className="flex gap-2">
              <button 
                id="back-underwrite-btn"
                onClick={() => setStep(1)}
                className="hover:bg-slate-50 border border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Back
              </button>
              <button
                id="choose-plan-btn"
                onClick={handleConfirmPlan}
                className="bg-[#1E5E52] text-white font-black text-[10px] uppercase tracking-wider px-5 py-2 rounded-xl hover:bg-[#164E43] transition cursor-pointer shadow-sm"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Confirm monthly recurring payment (auto-debit) */}
      {step === 3 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="text-center py-2 space-y-1">
              <span className="text-[#1E5E52] font-black font-mono text-2xl">₦{VITARA_PLANS[selectedPlanId].premium.toLocaleString()}</span>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Monthly Recurring premium auto-debit</p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 space-y-3.5 bg-slate-50/70 text-xs">
              <h5 className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider mb-2">OPay Auto-Debit Authorization & Mandate</h5>
              
              <div className="space-y-2.5 text-slate-600 leading-relaxed font-sans">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#1E5E52] shrink-0" />
                  <span>I authorize <strong>Vitara Care</strong> to automatically debit <strong>₦{VITARA_PLANS[selectedPlanId].premium.toLocaleString()}</strong> from my OPay wallet balance on the 13th of each month starting immediately.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#1E5E52] shrink-0" />
                  <span>I understand my medical coverage limits (<strong>₦{VITARA_PLANS[selectedPlanId].coverageLimit.toLocaleString()} annually</strong>) will activate instantly within 2 minutes of signature.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#1E5E52] shrink-0" />
                  <span>I may pause, upgrade, or cancel this payment mandate directly from the OPay Vitara settings portal at any time without fees.</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 bg-[#FAFDFB] border border-emerald-100 p-3 rounded-2xl text-xs leading-normal">
              <div className="flex items-center gap-1.5 font-bold text-[#1E5E52] uppercase text-[9px] tracking-wider">
                <AlertCircle className="w-4 h-4 text-[#1E5E52]" />
                <span>Wallet Verification check:</span>
              </div>
              <p className="text-slate-600 pt-1 text-[11px] font-sans">
                Your current OPay balance: <strong>₦{scenario.initialBalance.toLocaleString()}</strong>. Initial deduction leaves <strong>₦{(scenario.initialBalance - VITARA_PLANS[selectedPlanId].premium).toLocaleString()}</strong> in your wallet.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-150 flex justify-end items-center gap-2 text-xs mt-3">
            <button 
              id="back-plan-btn"
              onClick={() => setStep(2)}
              className="hover:bg-slate-50 border border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Modify Plan
            </button>
            <button
              id="finalize-debit-btn"
              onClick={handleFinalEnroll}
              className="bg-[#1E5E52] text-white font-black text-[10px] uppercase tracking-wider px-6 py-2.5 rounded-xl hover:bg-[#164E43] transition cursor-pointer shadow-sm"
            >
              Authorize & Sign Mandate
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Beautiful Enrollment Complete Success overlay */}
      {step === 4 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-16 h-16 bg-[#EAF2EF] border border-[#1E5E52]/20 rounded-full flex items-center justify-center text-[#1E5E52]"
          >
            <ShieldCheck className="w-10 h-10" />
          </motion.div>
          <div className="space-y-1.5 max-w-sm">
            <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Policy Activated Instantly!</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">Congratulations. Your recurring OPay premium of ₦{VITARA_PLANS[selectedPlanId].premium} has been approved. Your micro health certificate of coverage is live.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-full text-[10.5px] font-mono text-slate-500 animate-pulse uppercase tracking-wider">
            Linking your OPay wallet account...
          </div>
        </div>
      )}

    </div>
  );
}
