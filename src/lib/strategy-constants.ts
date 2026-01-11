// Strategy phase configuration for 70 strategies across 8 phases (v5.0)
// P1: #1-6 (6 strategies) - Foundation
// P2: #7-11 (5 strategies) - Core Deductions
// P3: #12-23 (12 strategies) - Retirement (includes new #12, #13)
// P4: #24-30 (7 strategies) - Credits
// P5: #31-38 (8 strategies) - Real Estate
// P6: #39-47 (9 strategies) - Acquisitions
// P7: #48-59 (12 strategies) - Exit (includes new #48)
// P8: #60-70 (11 strategies) - Charitable

export const STRATEGY_PHASES = [
  { id: "P1", name: "Foundation", color: "#1e40af", strategyRange: "1-6" },
  { id: "P2", name: "Core Deductions", color: "#059669", strategyRange: "7-11" },
  { id: "P3", name: "Retirement", color: "#7c3aed", strategyRange: "12-23" },
  { id: "P4", name: "Credits", color: "#ea580c", strategyRange: "24-30" },
  { id: "P5", name: "Real Estate", color: "#0891b2", strategyRange: "31-38" },
  { id: "P6", name: "Acquisitions", color: "#dc2626", strategyRange: "39-47" },
  { id: "P7", name: "Exit", color: "#ca8a04", strategyRange: "48-59" },
  { id: "P8", name: "Charitable", color: "#9333ea", strategyRange: "60-70" },
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
