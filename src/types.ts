/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PlanId {
  FOUNDATION = "foundation",
  HEALTH = "health",
  PREMIER = "premier"
}

export interface InsurancePlan {
  id: PlanId;
  name: string;
  premium: number; // in Naira (monthly)
  coverageLimit: number; // in Naira (annual)
  features: string[];
  description: string;
}

export interface OPayTransaction {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  type: 'transfer' | 'deposit' | 'bill_pay' | 'airtime';
  date: string;
  description: string;
  category: 'income' | 'food' | 'transport' | 'family' | 'utilities' | 'business';
}

export interface RiskProfile {
  score: number; // 0 to 100 (higher means lower risk/higher score)
  grade: 'A' | 'B' | 'C' | 'D';
  recommendedPlan: PlanId;
  analysisReason: string;
  indicators: {
    incomeStability: 'High' | 'Medium' | 'Low';
    spendingDiscipline: 'High' | 'Medium' | 'Low';
    savingBuffer: 'High' | 'Medium' | 'Low';
    healthExposure: 'Low' | 'Medium' | 'High';
  };
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  opayAccountNumber: string;
  opayBalance: number;
  isEnrolled: boolean;
  activePlan: PlanId | null;
  enrolledAt: string | null;
  riskProfile: RiskProfile | null;
  historyOfContributions: {
    amount: number;
    date: string;
    status: 'paid' | 'failed' | 'processing';
  }[];
}

export interface Claim {
  id: string;
  claimId: string;
  patientName: string;
  hospitalName: string;
  treatmentDate: string;
  diagnosis: string;
  amountRequested: number; // in Naira
  amountApproved: number; // in Naira
  status: 'pending_ocr' | 'analysing' | 'approved' | 'escalated' | 'rejected' | 'disbursed';
  classification: 'Maternity' | 'Emergency' | 'Accident' | 'Malaria/Outpatient' | 'Prescription' | 'Surgery' | 'Unknown';
  submittedAt: string;
  ocrExtractedData?: {
    patientName?: string;
    hospitalName?: string;
    treatmentDate?: string;
    diagnoses?: string[];
    items?: { description: string; cost: number }[];
    totalAmount?: number;
    receiptNumber?: string;
  };
  payoutWallet: string;
  fraudAlerts?: {
    isSuspicious: boolean;
    reason: string;
    score: number; // 0 to 100
  };
  humanNotes?: string;
}

export interface SupportMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export type NigeriaLanguage = 'en' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo';
