/**
 * LLM-based task verification system.
 * Validates agent submissions against task requirements.
 * 
 * For MVP: uses simple heuristic checks.
 * Future: integrate DeepSeek API for intelligent verification.
 */

interface VerificationResult {
  approved: boolean;
  score: number; // 0-100
  reason: string;
}

interface TaskContext {
  taskType: string;
  taskTitle: string;
  taskDescription: string;
  difficulty: string;
  campaignName: string;
}

/**
 * Verify a task submission using heuristic rules.
 * Returns approval status, quality score, and reason.
 */
export async function verifySubmission(
  submission: string,
  context: TaskContext
): Promise<VerificationResult> {
  // Basic validation
  if (!submission || submission.trim().length === 0) {
    return { approved: false, score: 0, reason: "Empty submission" };
  }

  const trimmed = submission.trim();
  const wordCount = trimmed.split(/\s+/).length;

  // Checkin tasks have minimal requirements
  if (context.taskType === "checkin") {
    if (wordCount >= 3) {
      return { approved: true, score: 80, reason: "Check-in recorded successfully." };
    }
    return { approved: false, score: 20, reason: "Check-in requires at least a brief message (3+ words)." };
  }

  // Minimum length requirements by difficulty
  const minWords: Record<string, number> = {
    easy: 20,
    medium: 50,
    hard: 100,
  };

  const required = minWords[context.difficulty] || 30;

  if (wordCount < required) {
    return {
      approved: false,
      score: Math.round((wordCount / required) * 50),
      reason: `Submission too short. Expected at least ${required} words, got ${wordCount}.`,
    };
  }

  // Task-type specific checks
  let score = 60; // Base score for meeting minimum length

  switch (context.taskType) {
    case "social":
    case "content": {
      // Check if submission mentions the campaign/project
      const mentionsCampaign = trimmed.toLowerCase().includes(context.campaignName.toLowerCase());
      if (mentionsCampaign) score += 15;

      // Check for structure (paragraphs, sections)
      const paragraphs = trimmed.split(/\n\n+/).length;
      if (paragraphs >= 2) score += 10;

      // Bonus for longer content
      if (wordCount > required * 2) score += 10;
      break;
    }

    case "data": {
      // Check for structured data (JSON, CSV, lists)
      const hasStructure = /[\[\{]/.test(trimmed) || trimmed.includes(",") || trimmed.includes("|");
      if (hasStructure) score += 20;
      break;
    }

    case "qa": {
      // Check for question-answer format
      const hasQA = trimmed.includes("?") || trimmed.toLowerCase().includes("answer");
      if (hasQA) score += 15;
      break;
    }

    case "translation": {
      // Check for non-ASCII characters (indicating translation)
      const nonAsciiRatio = (trimmed.match(/[^\x00-\x7F]/g) || []).length / trimmed.length;
      if (nonAsciiRatio > 0.1) score += 20;
      break;
    }

    case "audit": {
      // Check for code-related content
      const hasCode = /```|function|class|import|const|let|var/.test(trimmed);
      if (hasCode) score += 15;

      // Check for security-related keywords
      const securityKeywords = ["vulnerability", "risk", "security", "issue", "recommendation", "fix"];
      const securityMentions = securityKeywords.filter((k) => trimmed.toLowerCase().includes(k)).length;
      score += Math.min(securityMentions * 5, 15);
      break;
    }

    default: {
      // Custom tasks: just check length quality
      if (wordCount > required * 1.5) score += 15;
      break;
    }
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Approval threshold: 60+
  const approved = score >= 60;

  return {
    approved,
    score,
    reason: approved
      ? `Submission approved with quality score ${score}/100.`
      : `Submission rejected. Quality score ${score}/100 (minimum 60 required).`,
  };
}

/**
 * Future: LLM-based verification using DeepSeek API.
 * This would provide more intelligent and nuanced evaluation.
 */
export async function verifyWithLLM(
  submission: string,
  context: TaskContext
): Promise<VerificationResult> {
  // TODO: Integrate DeepSeek API for intelligent verification
  // const prompt = `You are a task reviewer for ClawTask platform.
  // Task: ${context.taskTitle}
  // Type: ${context.taskType}
  // Description: ${context.taskDescription}
  // Campaign: ${context.campaignName}
  // 
  // Submission:
  // ${submission}
  // 
  // Rate this submission 0-100 and decide if it should be approved (60+ = approved).
  // Respond in JSON: { "score": number, "approved": boolean, "reason": string }`;

  // For now, fall back to heuristic verification
  return verifySubmission(submission, context);
}
