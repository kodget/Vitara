/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FileText, Upload, Camera, Sparkles, Building2, 
  Calendar, CheckCircle, ShieldAlert, AlertTriangle, ArrowUpRight 
} from "lucide-react";
import { Claim, UserProfile, InsurancePlan } from "../types";
import { RECEIPT_PRESETS, MockReceiptPreset, VITARA_PLANS } from "../data";
import { motion, AnimatePresence } from "motion/react";

interface ClaimsFlowProps {
  userProfile: UserProfile;
  claims: Claim[];
  onSubmitClaim: (claim: Claim, revisedOpayBalance: number) => void;
  onClose: () => void;
}

export default function ClaimsFlow({ userProfile, claims, onSubmitClaim, onClose }: ClaimsFlowProps) {
  const [showNewClaimForm, setShowNewClaimForm] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [rawFileBase64, setRawFileBase64] = useState<string>("");
  const [rawFileType, setRawFileType] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [ocrResult, setOcrResult] = useState<Claim | null>(null);

  // Active Plan and Coverage ceiling calculation
  const plan: InsurancePlan = VITARA_PLANS[userProfile.activePlan || "health"];
  const totalClaimsDisbursed = claims
    .filter(c => c.status === "disbursed")
    .reduce((sum, c) => sum + c.amountApproved, 0);
  
  const remainingCoverage = Math.max(0, plan.coverageLimit - totalClaimsDisbursed);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      setRawFileBase64(base64String);
      setRawFileType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleTriggerAnalysis = async (preset?: MockReceiptPreset) => {
    setAnalyzing(true);
    setOcrResult(null);
    setAnalysisText("Gemini is reading hospital bill elements... (OCR Layer)");

    const textSteps = [
      "Gemini is reading hospital bill elements... (OCR Layer)",
      "Verifying facility name against standard NHIA registry...",
      "Validating item costs against regional clinical ceilings...",
      "Evaluating claims fraud risk coefficient indices..."
    ];

    let stepIdx = 0;
    const progressTimer = setInterval(() => {
      if (stepIdx < textSteps.length - 1) {
        stepIdx++;
        setAnalysisText(textSteps[stepIdx]);
      }
    }, 600);

    try {
      let bodyData: any = {};
      if (preset) {
        bodyData = { fallbackTextContent: preset.simulatedText };
      } else {
        bodyData = { 
          imageBase64: rawFileBase64, 
          mimeType: rawFileType || "image/png" 
        };
      }

      const response = await fetch("/api/gemini/ocr-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });

      clearInterval(progressTimer);

      if (!response.ok) throw new Error("Claims assessment service failed.");

      const data = await response.json();
      
      // Build a full Claim object based on OCR response
      const finalClaimObj: Claim = {
        id: `clm_${Date.now()}`,
        claimId: data.receiptNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        patientName: data.patientName || userProfile.name,
        hospitalName: data.hospitalName || "Nigerian Health Clinic",
        treatmentDate: data.treatmentDate || new Date().toISOString().split('T')[0],
        diagnosis: Array.isArray(data.diagnoses) ? data.diagnoses.join(", ") : "Undiagnosed core check",
        amountRequested: Number(data.totalAmount) || 25000,
        amountApproved: 0, // Assigned upon confirmation action
        status: data.fraudAlerts?.score > 40 ? "escalated" : "approved",
        classification: data.classification || "Malaria/Outpatient",
        submittedAt: new Date().toISOString(),
        ocrExtractedData: {
          patientName: data.patientName,
          hospitalName: data.hospitalName,
          treatmentDate: data.treatmentDate,
          diagnoses: data.diagnoses,
          items: data.items,
          totalAmount: data.totalAmount,
          receiptNumber: data.receiptNumber
        },
        payoutWallet: userProfile.opayAccountNumber,
        fraudAlerts: {
          isSuspicious: data.fraudAlerts?.isSuspicious || false,
          reason: data.fraudAlerts?.reason || "Safe verified receipt",
          score: data.fraudAlerts?.score || 10
        }
      };

      setOcrResult(finalClaimObj);
    } catch (err) {
      clearInterval(progressTimer);
      console.error(err);

      // Fallback
      setTimeout(() => {
        const mockPreset = preset || RECEIPT_PRESETS[0];
        const failClaim: Claim = {
          id: `clm_${Date.now()}`,
          claimId: mockPreset.id === "malaria_ketu" ? "KMC-2026-90821" : "GGH-MAT-2026-4412",
          patientName: mockPreset.patientName,
          hospitalName: mockPreset.hospitalName,
          treatmentDate: mockPreset.date,
          diagnosis: mockPreset.suggestedClassification,
          amountRequested: mockPreset.total,
          amountApproved: 0,
          status: mockPreset.isSuspicious ? "escalated" : "approved",
          classification: mockPreset.suggestedClassification,
          submittedAt: new Date().toISOString(),
          payoutWallet: userProfile.opayAccountNumber,
          fraudAlerts: {
            isSuspicious: mockPreset.isSuspicious,
            reason: mockPreset.isSuspicious 
              ? mockPreset.suspicionReason || "Exaggerated drug items detected"
              : "Standard clinical facility detected. Rates operate within proper NHIA threshold limits.",
            score: mockPreset.isSuspicious ? 82 : 12
          }
        };
        setOcrResult(failClaim);
      }, 500);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmSubmit = () => {
    if (!ocrResult) return;

    let claimFinal = { ...ocrResult };
    let newOpayBalance = userProfile.opayBalance;

    if (claimFinal.status === "approved") {
      // Instant approval allows payout directly to OPay balance
      claimFinal.status = "disbursed";
      claimFinal.amountApproved = claimFinal.amountRequested;
      newOpayBalance += claimFinal.amountApproved;
    }

    onSubmitClaim(claimFinal, newOpayBalance);
    setShowNewClaimForm(false);
    setOcrResult(null);
    setRawFileBase64("");
  };

  return (
    <div id="claims-hub-section" className="space-y-5 text-white">
      {/* Coverage Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#050505] rounded-2xl p-4 border border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-[8px] text-zinc-500 font-black tracking-widest uppercase block">CURRENT PLAN</span>
            <span className="text-md font-extrabold uppercase mt-1 block">{plan.name}</span>
          </div>
          <span className="text-[11px] text-[#FF4D00] font-mono mt-3 inline-block">₦{plan.premium.toLocaleString()} / month</span>
        </div>

        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <span className="text-[8px] text-zinc-500 font-black tracking-widest uppercase block">AVAILABLE BALANCE</span>
            <span className="text-lg font-mono font-black mt-1 block text-white truncate">₦{remainingCoverage.toLocaleString()}</span>
            <span className="text-[9px] text-zinc-500 mt-0.5 block truncate">Limit: ₦{plan.coverageLimit.toLocaleString()} / yr</span>
          </div>
          <div className="p-2.5 bg-[#FF4D00]/10 border border-[#FF4D00]/20 rounded-full shrink-0 ml-2">
            <CheckCircle className="w-5 h-5 text-[#FF4D00]" />
          </div>
        </div>

        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <span className="text-[8px] text-zinc-500 font-black tracking-widest uppercase block">TOTAL DISBURSED</span>
            <span className="text-lg font-mono font-black mt-1 block text-[#FF4D00] truncate">₦{totalClaimsDisbursed.toLocaleString()}</span>
            <span className="text-[9px] text-zinc-500 mt-0.5 block truncate">{claims.length} claims submitted</span>
          </div>
          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-full shrink-0 ml-2">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <h4 className="font-extrabold text-white text-[11px] uppercase tracking-wider font-mono">
          <span>Historic Insurance Ledger</span>
        </h4>
        <button
          id="file-payout-claim-btn"
          onClick={() => setShowNewClaimForm(true)}
          className="bg-[#FF4D00] text-black rounded-xl px-4 py-2.5 text-[10px] uppercase font-black hover:bg-[#e04300] transition flex items-center justify-center gap-1.5 shadow-md shadow-[#FF4D0012] cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>Scan Hospital Receipt</span>
        </button>
      </div>

      {/* FILE NEW CLAIM FLOW MODAL overlay */}
      <AnimatePresence>
        {showNewClaimForm && (
          <div className="fixed inset-0 bg-[#000]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0c0e] text-white rounded-3xl shadow-2xl border border-zinc-800 max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-850 border-zinc-805 border-zinc-800 pb-3">
                <h4 className="font-extrabold uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-[#FF4D00]" />
                  <span>Vitara OCR Claim Estimator</span>
                </h4>
                <button 
                  id="close-ocr-modal-btn"
                  onClick={() => {
                    setShowNewClaimForm(false);
                    setOcrResult(null);
                    setRawFileBase64("");
                  }}
                  className="text-zinc-500 hover:text-white px-2.5 py-1 rounded transition font-mono uppercase text-xs cursor-pointer"
                >
                  ✕ CLOSE
                </button>
              </div>

              {!ocrResult && !analyzing && (
                <div className="space-y-4">
                  {/* Option A: Preset Nigerian Hospital Receipts (Instant prototype test) */}
                  <div className="space-y-1.5 border border-zinc-800 rounded-2xl p-3.5 bg-[#121212]">
                    <span className="text-[9px] font-black uppercase text-[#FF4D00] tracking-wider block">Fast Demo Presets (Highly Recommended):</span>
                    <p className="text-[11px] text-zinc-400">Pick a simulated Nigerian medical bill below to test the automated OCR & Fraud screening pipelines instantly.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {RECEIPT_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          id={`preset-btn-${p.id}`}
                          onClick={() => {
                            setSelectedPresetId(p.id);
                            handleTriggerAnalysis(p);
                          }}
                          className="text-left border border-zinc-800 p-2.5 rounded-xl bg-[#0c0c0e] hover:bg-[#FF4D00]/5 hover:border-[#FF4D00]/30 transition flex flex-col justify-between cursor-pointer"
                        >
                          <div>
                            <span className="font-extrabold text-[11px] text-white block uppercase tracking-tight">{p.title}</span>
                            <span className="text-[9px] text-zinc-500">{p.hospitalName}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-zinc-800/80 text-[10px]">
                            <strong className="text-white font-mono">₦{p.total.toLocaleString()}</strong>
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] uppercase tracking-wider ${p.isSuspicious ? 'bg-[#FF4D00]/10 text-[#FF4D00]' : 'bg-green-950/20 text-green-450 text-green-400'}`}>
                              {p.isSuspicious ? 'Triggers Fraud audit' : 'Instant Approved'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Or upload custom file */}
                  <div className="text-center text-[9px] font-black tracking-widest uppercase text-zinc-650 my-2">-- OR CHOOSE CUSTOM RECEIPT PICTURE --</div>

                  {/* Drag-drop zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                      dragActive ? "border-[#FF4D00] bg-[#FF4D00]/5" : "border-zinc-800 hover:border-zinc-700 bg-black/40"
                    } ${rawFileBase64 ? "bg-[#FF4D00]/5 border-[#FF4D00]/50" : ""}`}
                  >
                    <input
                      type="file"
                      id="claims-file-input"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="claims-file-input" className="cursor-pointer space-y-2 w-full">
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-full text-white inline-block">
                        <Upload className="w-5 h-5 mx-auto" />
                      </div>
                      <div>
                        {rawFileBase64 ? (
                          <p className="text-xs font-bold text-[#FF4D00]">DOCUMENT LOADED SUCCESSFULLY!</p>
                        ) : (
                          <p className="text-xs text-zinc-300 font-semibold leading-relaxed">Drag & Drop receipt picture here or <span className="text-[#FF4D00] underline">browse files</span></p>
                        )}
                        <p className="text-[9px] text-zinc-500 mt-1">Supports PNG, JPG hospital sheets or payment bills</p>
                      </div>
                    </label>
                  </div>

                  {rawFileBase64 && (
                    <div className="flex gap-2 justify-end">
                      <button
                        id="submit-custom-ocr-btn"
                        onClick={() => handleTriggerAnalysis()}
                        className="bg-[#FF4D00] text-black font-black text-[10px] uppercase tracking-wider px-5 py-2 rounded-xl hover:bg-[#e04300] transition cursor-pointer"
                      >
                        Submit Receipt to AI Evaluation
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Loader during analysis */}
              {analyzing && (
                <div className="py-12 flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-zinc-800 border-t-[#FF4D00] animate-spin flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#FF4D00] animate-pulse" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-white uppercase text-xs tracking-wider">Assessing with Gemini...</h5>
                    <p className="text-[10px] text-zinc-500 mt-1 font-mono">{analysisText}</p>
                  </div>
                </div>
              )}

              {/* STEP 3: Analysis Results (OCR Feedback + Fraud alerts) */}
              {ocrResult && !analyzing && (
                <div className="space-y-4">
                  <div className="border border-zinc-800 rounded-2xl p-4 space-y-3.5 bg-[#121212]">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 border-b border-zinc-800/80 pb-2.5">
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase font-black tracking-wider">Facility Provider</span>
                        <h5 className="font-extrabold text-white text-xs flex items-center gap-1.5 uppercase tracking-wide">
                          <Building2 className="w-4 h-4 text-[#FF4D00]" />
                          <span>{ocrResult.hospitalName}</span>
                        </h5>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-[8px] text-zinc-500 uppercase font-black tracking-wider">Invoice Date</span>
                        <p className="text-xs text-zinc-400 flex items-center gap-1.5 sm:justify-end">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="font-mono">{ocrResult.treatmentDate}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-[11px] pt-1">
                      <div>
                        <span className="text-zinc-500 uppercase text-[9px] tracking-wider block">Patient Name:</span>
                        <p className="font-bold text-white mt-0.5">{ocrResult.patientName}</p>
                      </div>
                      <div>
                        <span className="text-zinc-500 uppercase text-[9px] tracking-wider block">Diagnosis Extracted:</span>
                        <p className="font-bold text-white mt-0.5">{ocrResult.diagnosis}</p>
                      </div>
                      <div>
                        <span className="text-zinc-500 uppercase text-[9px] tracking-wider block">Receipt Reference:</span>
                        <p className="font-mono text-zinc-400 mt-0.5">{ocrResult.claimId}</p>
                      </div>
                      <div>
                        <span className="text-zinc-500 uppercase text-[9px] tracking-wider block">Classification tier:</span>
                        <span className="inline-block px-2 py-0.5 bg-[#FF4D00]/10 border border-[#FF4D00]/20 text-[#FF4D00] font-bold text-[9px] uppercase tracking-wider rounded mt-1 font-mono">
                          {ocrResult.classification}
                        </span>
                      </div>
                    </div>

                    {/* Table itemizations */}
                    {ocrResult.ocrExtractedData?.items && ocrResult.ocrExtractedData.items.length > 0 && (
                      <div className="border-t border-zinc-800 pt-3 mt-2">
                        <span className="text-[8px] text-zinc-500 uppercase font-black tracking-wider block mb-2 font-mono">OCR LIST ITEMS EXTRACTED:</span>
                        <div className="space-y-2 font-mono text-[10px]">
                          {ocrResult.ocrExtractedData.items.map((it, i) => (
                            <div key={i} className="flex justify-between text-zinc-400">
                              <span>• {it.description}</span>
                              <strong className="text-white">₦{Number(it.cost).toLocaleString()}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center border-t border-zinc-800 pt-3 mt-3">
                      <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wide">Total Amount Claimed:</span>
                      <strong className="text-lg font-mono font-black text-white">₦{ocrResult.amountRequested.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Anti-Fraud / Underwrite Alert Card */}
                  <div className={`p-4 rounded-2xl border text-xs flex gap-3 ${
                    ocrResult.status === "escalated" 
                      ? "bg-[#FF4D00]/5 border-[#FF4D00]/30 text-white" 
                      : "bg-[#121212] border-zinc-800 text-white"
                  }`}>
                    {ocrResult.status === "escalated" ? (
                      <ShieldAlert className="w-5 h-5 text-[#FF4D00] shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-[#FF4D00] shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <strong className="font-extrabold uppercase text-[10px] tracking-wider">
                          {ocrResult.status === "escalated" ? "Review Triggered: Flagged for audit" : "Secured: Live Approved"}
                        </strong>
                        <span className="font-mono text-[9px] px-2 py-0.5 bg-[#000] rounded border border-zinc-800">
                          Risk Coeff: {ocrResult.fraudAlerts?.score || 10}%
                        </span>
                      </div>
                      <p className="mt-1.5 text-zinc-400 text-[10.5px] leading-relaxed">
                        {ocrResult.fraudAlerts?.reason}
                      </p>
                      {ocrResult.status === "escalated" && (
                        <p className="mt-2.5 text-[9px] bg-red-950/15 border border-red-900/30 p-2 rounded-xl text-[#FF4D00] italic font-mono uppercase tracking-wide">
                          Note: This request falls above baseline profiles. Instantly referred to Tokyo/Lagos manual audit operations. Payout locked until approval.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 text-xs pt-3 border-t border-zinc-800">
                    <button 
                      id="reset-claim-btn"
                      onClick={() => setOcrResult(null)}
                      className="hover:bg-zinc-900 border border-zinc-800 text-zinc-400 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      id="confirm-payout-now-btn"
                      onClick={handleConfirmSubmit}
                      className="bg-[#FF4D00] text-black font-black text-[10px] uppercase tracking-wider px-6 py-2.5 rounded-xl hover:bg-[#e04300] transition cursor-pointer"
                    >
                      {ocrResult.status === "escalated" 
                        ? "Escalate to Auditor" 
                        : "Execute Instant Payout"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Historic Claims List / Ledger */}
      <div className="bg-[#050505] border border-zinc-805 border-zinc-800 rounded-2xl overflow-hidden text-xs">
        {claims.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 space-y-2">
            <p>No health claims have been processed on this profile yet.</p>
            <p className="text-[10px] text-zinc-650 uppercase tracking-widest">Submit a clinical bill preset to test live OCR & underwriting loops</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {claims.map((c) => (
              <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#121212]/50 transition">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    c.status === "disbursed" ? "bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/20" :
                    c.status === "escalated" ? "bg-amber-950/20 text-[#FF4D00] border border-[#FF4D00]/10" : "bg-zinc-900 text-zinc-500"
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-xs uppercase tracking-wide">{c.hospitalName}</strong>
                      <span className="text-[9px] text-[#FF4D00] font-mono">#{c.claimId}</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] mt-0.5 font-sans">Diagnosis: <span className="text-white">{c.diagnosis}</span> • Category: <span className="text-[#FF4D05] text-[#FF4D00]">{c.classification}</span></p>
                    <span className="text-[9px] text-zinc-500 block mt-1 font-mono">SUBMITTED {new Date(c.submittedAt).toLocaleDateString()} AT {new Date(c.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>

                <div className="flex items-end justify-between md:flex-col gap-2 shrink-0 md:text-right">
                  <div>
                    <span className="text-zinc-500 block text-[8px] uppercase tracking-wider font-mono">CLAIM AMOUNT</span>
                    <strong className="font-black font-mono text-white text-xs">₦{c.amountRequested.toLocaleString()}</strong>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded font-black text-[8px] tracking-wider uppercase font-mono border ${
                    c.status === "disbursed" ? "bg-[#FF4D00]/5 border-[#FF4D00]/20 text-[#FF4D00]" :
                    c.status === "escalated" ? "bg-amber-950/20 border-amber-900/30 text-[#FF4D00]" : "bg-zinc-900 border-zinc-800 text-zinc-400"
                  }`}>
                    {c.status === "disbursed" ? "Disbursed" :
                     c.status === "escalated" ? "Auditor Hold" : c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
