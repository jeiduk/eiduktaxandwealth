// Strategy phase configuration for 70+ strategies across 9 phases (v6.0)
// Phase 1: #1-7 (7 strategies) - Foundation
// Phase 2: #8-17 (10 strategies) - Core Deductions
// Phase 3: #18-28 (11 strategies) - Retirement & Benefits
// Phase 4: #29-35 (7 strategies) - Credits & Multistate
// Phase 5: #36-43 (8 strategies) - Real Estate & PAL
// Phase 6: #44-50 (7 strategies) - Acquisitions & Leverage
// Phase 7: #51-61 (11 strategies) - Exit & Wealth Transfer
// Phase 8: #62-72 (11 strategies) - Charitable & Philanthropic
// Phase 9: #73-80 (8 strategies) - Premium Alternative Investments

export const STRATEGY_PHASES = [
  { id: "1", name: "Foundation", color: "#1e40af", strategyRange: "1-7" },
  { id: "2", name: "Core Deductions", color: "#059669", strategyRange: "8-17" },
  { id: "3", name: "Retirement & Benefits", color: "#7c3aed", strategyRange: "18-28" },
  { id: "4", name: "Credits & Multistate", color: "#ea580c", strategyRange: "29-35" },
  { id: "5", name: "Real Estate & PAL", color: "#0891b2", strategyRange: "36-43" },
  { id: "6", name: "Acquisitions & Leverage", color: "#dc2626", strategyRange: "44-50" },
  { id: "7", name: "Exit & Wealth Transfer", color: "#ca8a04", strategyRange: "51-61" },
  { id: "8", name: "Charitable & Philanthropic", color: "#9333ea", strategyRange: "62-72" },
  { id: "9", name: "Premium Alternative Investments", color: "#be185d", strategyRange: "73-80" },
] as const;

// Map phase ID to color for quick lookup
export const PHASE_COLORS: Record<string, string> = {
  "1": "#1e40af",
  "2": "#059669",
  "3": "#7c3aed",
  "4": "#ea580c",
  "5": "#0891b2",
  "6": "#dc2626",
  "7": "#ca8a04",
  "8": "#9333ea",
  "9": "#be185d",
};

// Helper function to get phase color
export const getPhaseColor = (phase: string): string => {
  return PHASE_COLORS[phase] || "#1e40af";
};

// Helper function to get phase info
export const getPhaseInfo = (phase: string) => {
  return STRATEGY_PHASES.find((p) => p.id === phase);
};

// Strategy status options
export const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started", className: "bg-gray-100 text-gray-700 border-gray-300" },
  { value: "in_progress", label: "In Progress", className: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "complete", label: "Complete", className: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { value: "considering", label: "Considering", className: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "active", label: "Active", className: "bg-teal-100 text-teal-700 border-teal-300" },
] as const;

// Document status options
export const DOCUMENT_STATUS_OPTIONS = ["received", "pending", "needed"] as const;
export type DocumentStatus = typeof DOCUMENT_STATUS_OPTIONS[number];

// Package tier strategy limits
export const TIER_MAX_STRATEGY: Record<string, number> = {
  Essentials: 0,
  Foundation: 17,
  Complete: 35,
  Premium: 80,
};