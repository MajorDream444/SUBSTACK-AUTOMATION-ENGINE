export const VALID_LANES = [
  "BWYH trust-building",
  "Contour authority / sales",
  "SAF narrative / research",
  "Major AI OS productization",
  "Personal doctrine / 10 Pillars"
] as const;

export type ContentLane = (typeof VALID_LANES)[number];

export function isValidLane(value: string | undefined): value is ContentLane {
  return Boolean(value && VALID_LANES.includes(value as ContentLane));
}

export function laneList(): string {
  return VALID_LANES.map((lane) => `- ${lane}`).join("\n");
}
