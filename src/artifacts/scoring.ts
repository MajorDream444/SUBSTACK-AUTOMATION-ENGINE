export type ScoreInput = {
  title: string;
  lane: string;
  markdown: string;
};

export type ArtifactScore = {
  clarity: number;
  insight: number;
  systemDepth: number;
  hookStrength: number;
  distributionFit: number;
  total: number;
  confidence: number;
  systemUnderneathWeak: boolean;
};

function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

export function extractSection(markdown: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^#{1,3} ${escaped}\\s*\\n([\\s\\S]*?)(?=\\n#{1,3} |\\n$)`, "m");
  return markdown.match(pattern)?.[1]?.trim() ?? "";
}

function isWeak(value: string): boolean {
  const text = value.trim().toLowerCase();
  return (
    text.length < 40 ||
    text.includes("todo") ||
    text.includes("add ") ||
    text.includes("name the system") ||
    text.includes("missing")
  );
}

function countHooks(markdown: string): number {
  const hookSet = extractSection(markdown, "Hook Set") || extractSection(markdown, "Reaction Hook Set");
  return hookSet.split("\n").filter((line) => /^-\s+Hook|\d+\.\s+|-\s+/.test(line.trim())).length;
}

export function scoreArtifact(input: ScoreInput): ArtifactScore {
  const coreIdea = extractSection(input.markdown, "Core Idea");
  const clearAngle = extractSection(input.markdown, "Clear Angle");
  const systemUnderneath = extractSection(input.markdown, "The System Underneath");
  const articleVersion = extractSection(input.markdown, "Substack Article Version") || extractSection(input.markdown, "Polished Editorial Edit");
  const distributionPlan = extractSection(input.markdown, "Distribution Plan") || extractSection(input.markdown, "Reaction Distribution Plan");
  const factCheckNotes = extractSection(input.markdown, "Fact-Check Notes");
  const riskNotes = extractSection(input.markdown, "Risk Notes");
  const hookCount = countHooks(input.markdown);
  const reactionDoctrine = input.lane === "Reaction Doctrine";
  const systemUnderneathWeak = reactionDoctrine ? isWeak(systemUnderneath) : false;

  const clarity = clamp((input.title ? 8 : 0) + (coreIdea.length > 30 ? 6 : 0) + (clearAngle.length > 30 ? 6 : 0), 20);
  const insight = clamp((articleVersion.length > 80 ? 12 : 0) + (input.markdown.includes("What They Missed") ? 8 : 0) + (coreIdea.length > 80 ? 5 : 0), 25);
  const systemDepth = clamp(
    (reactionDoctrine && !systemUnderneathWeak ? 20 : 0) +
      (!reactionDoctrine && input.markdown.includes("System Mapping") ? 15 : 0) +
      (input.markdown.includes("Major AI OS") ? 5 : 0),
    25
  );
  const hookStrength = clamp(hookCount * 3, 15);
  const distributionFit = clamp((distributionPlan.length > 80 ? 10 : 0) + (distributionPlan.includes("Substack") ? 3 : 0) + (distributionPlan.includes("YouTube") ? 2 : 0), 15);
  let total = clarity + insight + systemDepth + hookStrength + distributionFit;

  if (reactionDoctrine && systemUnderneathWeak) {
    total = Math.min(total, 50);
  }

  const confidence = clamp(
    total -
      (input.markdown.toLowerCase().includes("todo") ? 15 : 0) -
      (reactionDoctrine && (!factCheckNotes || isWeak(factCheckNotes)) ? 10 : 0) -
      (reactionDoctrine && (!riskNotes || isWeak(riskNotes)) ? 10 : 0),
    100
  );

  return {
    clarity,
    insight,
    systemDepth,
    hookStrength,
    distributionFit,
    total,
    confidence,
    systemUnderneathWeak
  };
}
