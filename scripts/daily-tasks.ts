/**
 * Daily tasks script — generates fresh tasks for active campaigns.
 * Run via: npx tsx scripts/daily-tasks.ts
 * 
 * Should be scheduled as a cron job (e.g., daily at 00:00 UTC).
 */

import { createClient } from "@insforge/sdk";

const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || "https://y46zd8i7.ap-southeast.insforge.app",
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzE1NzJ9.uH5DB9ZwSOkCa-AkRmB61WULeipKmdnYlD8A_WCUHIc",
});
const db = insforge.database;

async function main() {
  console.log("🔄 Running daily task generation...\n");

  // 1. Reset daily mining stats
  const today = new Date().toISOString().split("T")[0];
  const { data: existingStats } = await db.from("mining_stats").select("id").eq("id", "global").maybeSingle();
  if (existingStats) {
    await db.from("mining_stats").update({ today_released: 0, last_reset_date: today }).eq("id", "global");
  } else {
    await db.from("mining_stats").insert([{ id: "global", today_released: 0, last_reset_date: today }]);
  }
  console.log("✅ Reset daily mining stats");

  // 2. Check expired campaigns
  const now = new Date();
  const { data: expiredCampaigns } = await db.from("campaigns").select("id").eq("status", "active").lt("ends_at", now.toISOString());
  let expiredCount = 0;
  for (const c of (expiredCampaigns || [])) {
    await db.from("campaigns").update({ status: "ended" }).eq("id", c.id);
    expiredCount++;
  }
  if (expiredCount > 0) {
    console.log(`✅ Ended ${expiredCount} expired campaigns`);
  }

  // 3. Close full tasks and generate replenishment tasks
  const { data: activeCampaigns } = await db.from("campaigns").select().eq("status", "active");

  let closedTasks = 0;
  let newTasks = 0;

  for (const campaign of (activeCampaigns || [])) {
    const { data: openTasksData } = await db.from("campaign_tasks").select().eq("campaign_id", campaign.id).eq("status", "open");
    const tasks = openTasksData || [];

    // Close full tasks
    for (const task of tasks) {
      const { count: claimCount } = await db.from("task_claims").select("id", { count: "exact", head: true }).eq("task_id", task.id);
      if ((claimCount || 0) >= task.max_claims) {
        await db.from("campaign_tasks").update({ status: "full" }).eq("id", task.id);
        closedTasks++;
      }
    }

    // Generate replenishment tasks
    const remainingOpenTasks = tasks.length - closedTasks;
    if (remainingOpenTasks < 5 && campaign.remaining_amount > 0) {
      const reward = tasks[0]?.reward || 10;
      const taskType = tasks[0]?.task_type || "social";
      const difficulty = tasks[0]?.difficulty || "medium";

      const tasksToCreate = Math.min(5, Math.floor(campaign.remaining_amount / reward));
      if (tasksToCreate > 0) {
        const newTasksData = Array.from({ length: tasksToCreate }, (_, i) => ({
          campaign_id: campaign.id,
          title: `${campaign.name} Daily Task #${Date.now()}-${i}`,
          description: `Complete a ${taskType} task for ${campaign.name}`,
          task_type: taskType,
          difficulty,
          reward,
          max_claims: 1,
          status: "open",
          expires_at: campaign.ends_at,
        }));
        await db.from("campaign_tasks").insert(newTasksData);
        newTasks += tasksToCreate;
      }
    }
  }

  if (closedTasks > 0) console.log(`✅ Closed ${closedTasks} fully claimed tasks`);
  if (newTasks > 0) console.log(`✅ Generated ${newTasks} new replenishment tasks`);

  // 4. Summary
  const { data: allCampaigns } = await db.from("campaigns").select("status");
  const statusCounts: Record<string, number> = {};
  for (const c of (allCampaigns || [])) {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  }
  console.log("\n📊 Campaign Status:");
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`   ${status}: ${count}`);
  }

  const { count: totalAgents } = await db.from("agents").select("id", { count: "exact", head: true });
  const { count: totalOpenTasks } = await db.from("campaign_tasks").select("id", { count: "exact", head: true }).eq("status", "open");
  console.log(`\n👥 Total Agents: ${totalAgents}`);
  console.log(`📋 Open Tasks: ${totalOpenTasks}`);
  console.log("\n✨ Daily tasks complete!");
}

main().catch(console.error);
