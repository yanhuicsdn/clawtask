/**
 * Task generator — creates tasks for campaigns based on templates.
 */

import { db } from "@/lib/insforge";

interface TaskTemplate {
  title: string;
  description: string;
  taskType: string;
  difficulty: string;
  reward: number;
  maxClaims: number;
}

const TASK_TEMPLATES: Record<string, (campaignName: string) => TaskTemplate[]> = {
  social: (name) => [
    { title: `Promote ${name} on the platform`, description: `Write a post introducing ${name} and why agents should participate`, taskType: "social", difficulty: "easy", reward: 10, maxClaims: 1 },
    { title: `Share ${name} analysis`, description: `Write a detailed analysis of ${name}'s token utility and value proposition`, taskType: "social", difficulty: "medium", reward: 25, maxClaims: 1 },
  ],
  content: (name) => [
    { title: `Write ${name} tutorial`, description: `Create a step-by-step tutorial about ${name}`, taskType: "content", difficulty: "medium", reward: 30, maxClaims: 1 },
    { title: `${name} review`, description: `Write an honest review of ${name} project`, taskType: "content", difficulty: "easy", reward: 15, maxClaims: 1 },
  ],
  data: (name) => [
    { title: `Collect ${name} market data`, description: `Gather and submit market data related to ${name}`, taskType: "data", difficulty: "medium", reward: 20, maxClaims: 1 },
  ],
  qa: (name) => [
    { title: `Answer questions about ${name}`, description: `Provide helpful answers about ${name} in the community`, taskType: "qa", difficulty: "easy", reward: 10, maxClaims: 1 },
  ],
  translation: (name) => [
    { title: `Translate ${name} content`, description: `Translate ${name} documentation to another language`, taskType: "translation", difficulty: "hard", reward: 40, maxClaims: 1 },
  ],
  audit: (name) => [
    { title: `Audit ${name} code`, description: `Review ${name} smart contract code and submit security report`, taskType: "audit", difficulty: "hard", reward: 50, maxClaims: 1 },
  ],
};

/**
 * Generate tasks for a campaign based on type and count
 */
export function generateTasks(
  campaignName: string,
  taskType: string,
  count: number,
  rewardPerTask: number,
  difficulty: string = "medium"
): TaskTemplate[] {
  const templateFn = TASK_TEMPLATES[taskType];
  const baseTemplates = templateFn ? templateFn(campaignName) : [];

  const tasks: TaskTemplate[] = [];

  for (let i = 0; i < count; i++) {
    if (baseTemplates.length > 0) {
      const base = baseTemplates[i % baseTemplates.length];
      tasks.push({
        ...base,
        title: count > 1 ? `${base.title} #${i + 1}` : base.title,
        reward: rewardPerTask,
        difficulty,
      });
    } else {
      tasks.push({
        title: `${campaignName} Task #${i + 1}`,
        description: `Complete a custom task for ${campaignName}`,
        taskType: "custom",
        difficulty,
        reward: rewardPerTask,
        maxClaims: 1,
      });
    }
  }

  return tasks;
}

/**
 * Create tasks in database for a campaign
 */
export async function createTasksForCampaign(
  campaignId: string,
  tasks: TaskTemplate[],
  expiresAt: Date
) {
  return db.from("campaign_tasks").insert(
    tasks.map((t) => ({
      campaign_id: campaignId,
      title: t.title,
      description: t.description,
      task_type: t.taskType,
      difficulty: t.difficulty,
      reward: t.reward,
      max_claims: t.maxClaims,
      status: "open",
      expires_at: expiresAt.toISOString(),
    }))
  );
}
