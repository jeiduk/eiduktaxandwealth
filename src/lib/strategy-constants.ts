// Strategy phase configuration for 67 strategies across 8 phases
// P1: #1-6 (6 strategies) - Foundation
// P2: #7-11 (5 strategies) - Core Deductions
// P3: #12-21 (10 strategies) - Retirement
// P4: #22-28 (7 strategies) - Credits
// P5: #29-36 (8 strategies) - Real Estate
// P6: #37-45 (9 strategies) - Acquisitions
// P7: #46-56 (11 strategies) - Exit
// P8: #57-67 (11 strategies) - Charitable

export const STRATEGY_PHASES = [
  { id: "P1", name: "Foundation", color: "#1e40af", strategyRange: "1-6" },
  { id: "P2", name: "Core Deductions", color: "#059669", strategyRange: "7-11" },
  { id: "P3", name: "Retirement", color: "#7c3aed", strategyRange: "12-21" },
  { id: "P4", name: "Credits", color: "#ea580c", strategyRange: "22-28" },
  { id: "P5", name: "Real Estate", color: "#0891b2", strategyRange: "29-36" },
  { id: "P6", name: "Acquisitions", color: "#dc2626", strategyRange: "37-45" },
  { id: "P7", name: "Exit", color: "#ca8a04", strategyRange: "46-56" },
  { id: "P8", name: "Charitable", color: "#9333ea", strategyRange: "57-67" },
] as const;

// Map phase ID to color for quick lookup
export const PHASE_COLORS: Record<string, string> = {
  P1: "#1e40af",
  P2: "#059669",
  P3: "#7c3aed",
  P4: "#ea580c",
  P5: "#0891b2",
  P6: "#dc2626",
  P7: "#ca8a04",
  P8: "#9333ea",
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
  Foundation: 13,
  Complete: 30,
  Premium: 67,
};
