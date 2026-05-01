import type { ArtifactScore } from "./scoring.js";

export type RiskLevel = "low" | "medium" | "high";
export type PublishMode = "auto" | "review" | "block" | "delay";
export type ArtifactStatus = "draft" | "ready" | "needs_review" | "needs_rewrite" | "scheduled" | "scheduled_dry_run" | "published" | "blocked";

export type GovernanceInput = {
  lane: string;
  title: string;
  markdown: string;
  baseStatus: ArtifactStatus;
  score: ArtifactScore;
};

export type GovernanceDecision = {
  riskLevel: RiskLevel;
  publishMode: PublishMode;
  requiresMajorReview: boolean;
  status: ArtifactStatus;
  nextAction: string;
};

function includesAny(text: string, keywords: string[]): boolean {
  const value = text.toLowerCase();
  return keywords.some((keyword) => value.includes(keyword.toLowerCase()));
}

export function determineRiskLevel(input: Pick<GovernanceInput, "lane" | "title" | "markdown">): RiskLevel {
  const combined = `${input.lane} ${input.title} ${input.markdown}`;

  if (
    input.lane === "SAF narrative / research" ||
    includesAny(combined, ["geopolitics", "finance", "legal", "jamaica oil", "diaspora strategy", "sanction", "election"])
  ) {
    return "high";
  }

  if (
    input.lane === "Contour authority / sales" ||
    input.lane === "Reaction Doctrine" ||
    includesAny(combined, ["joe budden", "cultural commentary", "business diagnosis", "diagnosis"])
  ) {
    return "medium";
  }

  return "low";
}

export function applyRiskGovernance(input: GovernanceInput): GovernanceDecision {
  const riskLevel = determineRiskLevel(input);
  const lower = input.markdown.toLowerCase();
  const missingFactRisk =
    riskLevel === "high" &&
    (lower.includes("todo: list claims") || lower.includes("todo: identify defamation") || !lower.includes("fact-check notes") || !lower.includes("risk notes"));
  const weakThesis = input.score.clarity < 12 || input.score.insight < 12;
  const reactionBlock = input.lane === "Reaction Doctrine" && input.score.systemUnderneathWeak;

  if (input.baseStatus === "blocked" || reactionBlock || missingFactRisk || (riskLevel === "high" && weakThesis)) {
    return {
      riskLevel,
      publishMode: "block",
      requiresMajorReview: true,
      status: "blocked",
      nextAction: reactionBlock
        ? "Strengthen the Reaction Doctrine system-underneath section before Command Center review."
        : "Resolve governance blockers before Command Center review."
    };
  }

  if (riskLevel === "high") {
    return {
      riskLevel,
      publishMode: "review",
      requiresMajorReview: true,
      status: "needs_review",
      nextAction: "Send to Command Center for high-risk Major review."
    };
  }

  if (riskLevel === "medium" || input.score.total < 85 || input.score.confidence < 80) {
    return {
      riskLevel,
      publishMode: "review",
      requiresMajorReview: true,
      status: input.score.total >= 60 ? "needs_review" : "draft",
      nextAction: "Route to Command Center review queue."
    };
  }

  return {
    riskLevel,
    publishMode: "auto",
    requiresMajorReview: false,
    status: "ready",
    nextAction: "Eligible for Command Center auto rules when Command Center enables them."
  };
}
