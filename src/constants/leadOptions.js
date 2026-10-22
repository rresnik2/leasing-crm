// Single source for lead field options. Previously duplicated in
// LeadCard, LeadModal and AddLeadModal.

// Ordered stages of the leasing pipeline, used by PipelineProgress.
export const PIPELINE_STAGES = [
  "New Inquiry",
  "Contacted",
  "Tour Scheduled",
  "Tour Completed",
  "Application Submitted",
  "Approved",
  "Leased",
];

// Statuses that take a lead off the pipeline.
export const CLOSED_STATUSES = [
  "Not Interested",
  "Search Hold",
  "Leased Elsewhere",
];

export const LEAD_STATUSES = [...PIPELINE_STAGES, ...CLOSED_STATUSES];

// Statuses with nothing left to do: no score or next step is shown.
export const FINISHED_STATUSES = ["Leased", "Not Interested", "Leased Elsewhere"];

export const UNIT_TYPES = ["Studio", "1 Bedroom", "2 Bedroom", "3 Bedroom"];

export const MOVE_REASONS = [
  "Job Relocation",
  "Upsizing",
  "Downsizing",
  "First Time Renter",
  "Closer to Work",
  "Other",
];

// Badge tone for each status (see Badge tones in docs/design-system/README.md).
export const STATUS_TONES = {
  "New Inquiry": "blue",
  "Contacted": "yellow",
  "Tour Scheduled": "purple",
  "Tour Completed": "indigo",
  "Application Submitted": "orange",
  "Approved": "green",
  "Leased": "teal",
  "Not Interested": "neutral",
  "Search Hold": "rose",
  "Leased Elsewhere": "red",
};

// Badge tone for each lead-score priority returned by the scoring API.
// High is brand, not danger: red already means Leased Elsewhere and Delete.
export const PRIORITY_TONES = {
  High: "brand",
  Medium: "warning",
  Low: "neutral",
};
