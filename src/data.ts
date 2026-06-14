/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlanId, InsurancePlan, OPayTransaction, UserProfile } from "./types";

export const VITARA_PLANS: Record<PlanId, InsurancePlan> = {
  [PlanId.FOUNDATION]: {
    id: PlanId.FOUNDATION,
    name: "Foundation Plan",
    premium: 500,
    coverageLimit: 150000,
    features: [
      "Basic emergency ward admissions",
      "Acute malaria / typhoid treatments",
      "Accidental wound dressings",
      "Core childhood immunization",
      "Direct OPay wallet payout in under 2 hours"
    ],
    description: "Designed for small-scale traders and rural workers. Essential emergency safeguards at the cost of a single cold beverage."
  },
  [PlanId.HEALTH]: {
    id: PlanId.HEALTH,
    name: "Health Plan",
    premium: 1500,
    coverageLimit: 450000,
    features: [
      "Full outpatient consultations & routine tests",
      "Maternity delivery coverage (up to ₦120,000 allowance)",
      "Broader emergency operations list",
      "Prescription drugs coverage (partner pharmacies)",
      "Pediatric care for up to 2 dependents"
    ],
    description: "Ideal for family breadwinners and artisans wanting robust cover including maternal benefits and prescription coverage."
  },
  [PlanId.PREMIER]: {
    id: PlanId.PREMIER,
    name: "Premier Plan",
    premium: 3500,
    coverageLimit: 1000000,
    features: [
      "Comprehensive hospitalization & private ward upgrades",
      "Complete major surgeries listing (appendix, fractures, hernia)",
      "Advanced diagnostics (X-Rays, Ultrasound, Echocardiograms)",
      "High family pharmacy monthly allowance",
      "Emergency dental & optical core services"
    ],
    description: "Designed for gig workers, transport riders, and corporate workers seeking absolute protection and million-naira coverage ceilings."
  }
};

export interface MockUserProfileScenario {
  id: string;
  name: string;
  occupation: string;
  details: string;
  avatar: string;
  initialBalance: number;
  transactions: OPayTransaction[];
  surveyAnswers: {
    ageBracket: string;
    occupation: string;
    hasPreExisting: string;
    dependents: string;
  };
}

export const USER_SCENARIOS: MockUserProfileScenario[] = [
  {
    id: "mama_chisom",
    name: "Mama Chisom",
    occupation: "Market Pepper Trader",
    details: "Sells pepper and tomatoes at Ikosi Market. Daily irregular income, vulnerable to sudden illness setbacks.",
    avatar: "🌶️",
    initialBalance: 32000,
    surveyAnswers: {
      ageBracket: "45 - 54 years",
      occupation: "Informal Market Trader / Saleswoman",
      hasPreExisting: "No serious underlying disease, minor knee stiffness",
      dependents: "3 children"
    },
    transactions: [
      { id: "tx_001", sender: "OPay Customer", receiver: "Mama Chisom", amount: 4500, type: "deposit", date: "2026-06-11", description: "Payment for Pepper crate", category: "income" },
      { id: "tx_002", sender: "OPay Customer", receiver: "Mama Chisom", amount: 6200, type: "deposit", date: "2026-06-11", description: "Retail sales vegetables", category: "income" },
      { id: "tx_003", sender: "Mama Chisom", receiver: "Ikorodu Agro Supply", amount: 8000, type: "transfer", date: "2026-06-10", description: "Tomato wholesale restock", category: "business" },
      { id: "tx_004", sender: "OPay Customer", receiver: "Mama Chisom", amount: 3500, type: "deposit", date: "2026-06-10", description: "Pepper sales", category: "income" },
      { id: "tx_005", sender: "Mama Chisom", receiver: "Eko Disco", amount: 2500, type: "bill_pay", date: "2026-06-09", description: "Electricity bill recharge", category: "utilities" },
      { id: "tx_006", sender: "OPay Customer", receiver: "Mama Chisom", amount: 5000, type: "deposit", date: "2026-06-08", description: "Market stall transfer", category: "income" },
      { id: "tx_007", sender: "Mama Chisom", receiver: "Chisom School Fees", amount: 15000, type: "transfer", date: "2026-06-05", description: "Term fee part payment", category: "family" },
      { id: "tx_008", sender: "Mama Chisom", receiver: "Ketu Wholesale Pharmacy", amount: 1800, type: "transfer", date: "2026-06-03", description: "Cough syrups and pain relievers", category: "food" }
    ]
  },
  {
    id: "seyi_kuti",
    name: "Seyi Kuti",
    occupation: "Okada Transport Rider",
    details: "Understands high physical risks on Lagos roads. Depends on daily riding. Requires fast, robust accident coverage.",
    avatar: "🏍️",
    initialBalance: 18500,
    surveyAnswers: {
      ageBracket: "25 - 34 years",
      occupation: "Transport Rider / Okada operator",
      hasPreExisting: "No",
      dependents: "1 child, wife"
    },
    transactions: [
      { id: "tx_101", sender: "OPay Rider Pass", receiver: "Seyi Kuti", amount: 1200, type: "deposit", date: "2026-06-12", description: "Lekki fare trip", category: "income" },
      { id: "tx_102", sender: "OPay Rider Pass", receiver: "Seyi Kuti", amount: 1500, type: "deposit", date: "2026-06-12", description: "Ikeja express route", category: "income" },
      { id: "tx_103", sender: "OPay Rider Pass", receiver: "Seyi Kuti", amount: 2000, type: "deposit", date: "2026-06-11", description: "Victoria Island ride", category: "income" },
      { id: "tx_104", sender: "Seyi Kuti", receiver: "NNPC Filling Station", amount: 3500, type: "bill_pay", date: "2026-06-11", description: "Bike fuel refueling", category: "transport" },
      { id: "tx_105", sender: "OPay Rider Pass", receiver: "Seyi Kuti", amount: 1800, type: "deposit", date: "2026-06-10", description: "Maryland trip ride", category: "income" },
      { id: "tx_106", sender: "Seyi Kuti", receiver: "Bike Parts Lagos", amount: 4500, type: "transfer", date: "2026-06-09", description: "Clutch wire and brake pad replacement", category: "business" },
      { id: "tx_107", sender: "Seyi Kuti", receiver: "Iya Segun Food Joint", amount: 1200, type: "transfer", date: "2026-06-08", description: "Daily lunch amala", category: "food" }
    ]
  },
  {
    id: "amaka_okafor",
    name: "Amaka Okafor",
    occupation: "Fashion Boutique Manager",
    details: "Steady online merchant, sells fabrics and wears on Instagram. Income is stable. Desires comprehensive coverage.",
    avatar: "👗",
    initialBalance: 125000,
    surveyAnswers: {
      ageBracket: "18 - 24 years",
      occupation: "Boutique Manager / Designer",
      hasPreExisting: "Manageable Asthma (needs inhaler occasionally)",
      dependents: "None"
    },
    transactions: [
      { id: "tx_201", sender: "OPay Boutique Cust", receiver: "Amaka Okafor", amount: 45000, type: "deposit", date: "2026-06-13", description: "Ankara Fabrics sales", category: "income" },
      { id: "tx_202", sender: "OPay Boutique Cust", receiver: "Amaka Okafor", amount: 25000, type: "deposit", date: "2026-06-12", description: "Aso oke delivery", category: "income" },
      { id: "tx_203", sender: "Amaka Okafor", receiver: "D&D Textile Mill", amount: 50000, type: "transfer", date: "2026-06-10", description: "Raw silk wholesale purchases", category: "business" },
      { id: "tx_204", sender: "Amaka Okafor", receiver: "MTN Nigeria", amount: 5000, type: "airtime", date: "2026-06-08", description: "Data bundle refill", category: "utilities" },
      { id: "tx_205", sender: "Amaka Okafor", receiver: "Rent Lagos Apartment", amount: 40000, type: "transfer", date: "2026-06-01", description: "Monthly shared warehouse co-space fee", category: "business" }
    ]
  }
];

export interface MockReceiptPreset {
  id: string;
  title: string;
  hospitalName: string;
  patientName: string;
  date: string;
  simulatedText: string;
  items: { description: string; cost: number }[];
  total: number;
  isSuspicious: boolean;
  suspicionReason?: string;
  suggestedClassification: 'Maternity' | 'Emergency' | 'Accident' | 'Malaria/Outpatient' | 'Prescription' | 'Surgery' | 'Unknown';
}

export const RECEIPT_PRESETS: MockReceiptPreset[] = [
  {
    id: "malaria_ketu",
    title: "Malaria Outpatient (Ketu Clinic)",
    hospitalName: "Ketu Medical Clinic & Diagnostics",
    patientName: "Mama Chisom",
    date: "2026-06-12",
    suggestedClassification: "Malaria/Outpatient",
    items: [
      { description: "General Consultation Fee", cost: 4000 },
      { description: "Lab Diagnostics (Malaria MP, Blood smear)", cost: 6500 },
      { description: "Artemether Injection Core Ampoules", cost: 11000 },
      { description: "Coartem tablets & Paracetamol packs", cost: 7500 }
    ],
    total: 29000,
    isSuspicious: false,
    simulatedText: `INVOICE & MEDICAL RECEIPT
-------------------------------------------
HOTLINE: +234-803-KET CLINIC
FACILITY: Ketu Medical Clinic & Diagnostics, Ketu, Lagos.
REG: KMC-9082
DATE: 12-06-2026

PATIENT NAME: Mama Chisom (OPay ID Ref: MC-3482)
DIAGNOSES: Sharp fever, severe joint pain. Positive Plasmodium Falciparum (Malaria MP ++).

BILLING BREAKDOWN:
1. General Outpatient Consultation --- N4,000.00
2. Lab Parasitology Profile (MP & Widal) --- N6,500.00
3. Artemether Inj 80mg Administered --- N11,000.00
4. Oral Medication Dispensed (Coartem & Analgesics) --- N7,500.00

GRAND TOTAL: N29,000.00
STATUS: FULLY PAID (POS Terminal No: 821819)
THANK YOU. SIGNED CHIEF MEDICAL OFFICER.`
  },
  {
    id: "maternity_gbagada",
    title: "Maternity Standard Delivery (Gbagada Hospital)",
    hospitalName: "Gbagada General Hospital Maternal Center",
    patientName: "Adebola Kuti",
    date: "2026-06-10",
    suggestedClassification: "Maternity",
    items: [
      { description: "Normal Delivery Labor Ward Bundle", cost: 65000 },
      { description: "Obstetrician Specialist Supervision", cost: 25000 },
      { description: "Postnatal Mother & Infant Ward (2 Days)", cost: 30000 },
      { description: "Standard Neonatal Syringe & Drug Pack", cost: 15000 }
    ],
    total: 135000,
    isSuspicious: false,
    simulatedText: `GBAGADA GENERAL HOSPITAL - MATERNAL WING
1 Hospital Road, Gbagada, Lagos State
TEL: 01-4903332

RECEIPT NO: GGH-MAT-2026-4412
DATE OF ACCOUNT SHEET: June 10, 2026

PATIENT: Adebola Kuti
SPOUSE ADMISSION REF: Seyi Kuti (08092102923)
PROCEDURE: Spontaneous Vaginal Delivery (Normal Birth)
DELIVERED: Healthy Female Infant (3.2kg)

ITEMIZED MEDICAL COSTINGS:
1. Labor Ward & Delivery Room Bundle Fee: N65,000.00
2. Specialist Ob/Gyn Consultation & Delivery assistance: N25,000.00
3. Post-natal Care Ward Ward (Semi-Private, 2 nights): N30,000.00
4. Core Delivery Consumables (Oxytocin, Syringes, Sutures, Infant pack): N15,000.00

Grand Total Due: N135000.00
PAYMENT METHOD: Direct Ledger Bank transfer.
STAMPED SIGNED: Dr. Kunle Peters, Ob/Gyn Lead Unit B.`
  },
  {
    id: "accident_ortho",
    title: "Fracture Treatment (Igbobi Orthopedic)",
    hospitalName: "Igbobi National Orthopedic Center",
    patientName: "Seyi Kuti",
    date: "2026-06-11",
    suggestedClassification: "Accident",
    items: [
      { description: "Emergency Fracture Cast & POP Placement", cost: 45000 },
      { description: "Limb X-Ray Imaging Diagnostic scan", cost: 15000 },
      { description: "Surgical wound debridement & dressing", cost: 18000 },
      { description: "Pain Relievers & Injectable Antibiotics Portfolio", cost: 12000 }
    ],
    total: 90000,
    isSuspicious: false,
    simulatedText: `NATIONAL ORTHOPAEDIC HOSPITAL IGBOBI, LAGOS
P.M.B. 2009, Yaba, Lagos State
INVOICE NO: NOHI-2026-8802
DATE: June 11, 2026

PATIENT: Seyi Kuti
ADMISSION CLASS: Traffic Accident Emergency (Rider)
DIAGNOSES: Left Tibial Fracture, clean, non-displaced. External skin scratches.

CHARGES:
1. Plaster of Paris (POP) Application Cast and Splints: N45,000.00
2. Radiology Lab (2 Views Left Tib/Fib X-ray): N15,000.00
3. Trauma Laceration Dressing, Disinfecting, Suturing: N18,000.00
4. Analgesics (Dynapar, Tramadol) and Antibiotic pack: N12,000.00

TOTAL: N90,000.00
PAYMENT FOR SERVICE RECEIVED. SIGNED MATRON FOLASADE OUTPATIENT.`
  },
  {
    id: "suspicious_malpractice",
    title: "Suspicious Double Bill (Altered Receipt)",
    hospitalName: "Ikorodu Community Healing Clinic",
    patientName: "Amaka Okafor",
    date: "2026-06-05",
    suggestedClassification: "Malaria/Outpatient",
    items: [
      { description: "Malaria Treatment (Exaggerated cost)", cost: 95000 },
      { description: "Paracetamol Injection (Altered line)", cost: 85000 }
    ],
    total: 180000,
    isSuspicious: true,
    suspicionReason: "Extremely exaggerated costs for simple outpatient malaria treatments. Altered digits detected. Normal cost of Paracetamol injection is under ₦2,000, but billed as ₦85,000 which triggers fraud algorithms.",
    simulatedText: `IKORODU COMMUNITY HEALING CLINIC
Lagos State, Nigeria
BILL NO: ICH-90182
DATE: 05-06-2026

BILLING TO: Amaka Okafor

1. Malaria Treatment Core IV Drip infusion Service (Normal cost N10,000) --- Billed: N95,000.00
2. Paracetamol Injection Drip Ampoules (Physically altered receipt digits) --- Billed: N85,000.00

TOTAL CHARGES: N180,000.00 (Naira)

[NOTE: Notice that the digits are written with irregular spacers and spacing and costings are highly abnormal for generic outpatient drugs. Billed far above Federal Health ministry standard price caps.]`
  }
];
