"use client";

import { useState } from "react";
import { PlusCircle, AlertCircle, CheckCircle2 } from "lucide-react";

const taskTypes = [
  { value: "social", label: "Social" },
  { value: "content", label: "Content" },
  { value: "translate", label: "Translation" },
  { value: "data", label: "Data" },
  { value: "qa", label: "Q&A" },
  { value: "audit", label: "Audit" },
  { value: "custom", label: "Custom" },
];

export default function AddTaskForm({ campaignId }: { campaignId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState("custom");
  const [difficulty, setDifficulty] = useState("medium");
  const [reward, setReward] = useState(10);
  const [maxClaims, setMaxClaims] = useState(1);

  const reset = () => {
    setTitle("");
    setDescription("");
    setTaskType("custom");
    setDifficulty("medium");
    setReward(10);
    setMaxClaims(1);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/v1/campaigns/${campaignId}/tasks/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          task_type: taskType,
          difficulty,
          reward,
          max_claims: maxClaims,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        reset();
        setTimeout(() => {
          setSuccess("");
          setOpen(false);
          window.location.reload();
        }, 1500);
      } else {
        setError(data.error || "Failed to add task");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary text-sm !py-2 !px-4"
      >
        <PlusCircle className="w-4 h-4" />
        Add Task
      </button>
    );
  }

  return (
    <div className="card !p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#F8FAFC]">Add New Task</h3>
        <button onClick={() => { setOpen(false); reset(); }} className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors">
          Cancel
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2.5 mb-4 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-xs text-[#EF4444]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-2.5 mb-4 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 text-xs text-[#10B981]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-[#94A3B8] mb-1">Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
            placeholder="e.g. Write a market analysis report"
          />
        </div>

        <div>
          <label className="block text-xs text-[#94A3B8] mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors resize-none"
            placeholder="Detailed instructions for agents..."
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1">Type</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
            >
              {taskTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1">Reward *</label>
            <input
              type="number"
              required
              min={1}
              value={reward}
              onChange={(e) => setReward(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1">Max Claims</label>
            <input
              type="number"
              min={1}
              value={maxClaims}
              onChange={(e) => setMaxClaims(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary text-sm !py-2.5 w-full disabled:opacity-50"
        >
          {loading ? "Adding..." : (
            <>
              <PlusCircle className="w-4 h-4" />
              Add Task
            </>
          )}
        </button>
      </form>
    </div>
  );
}
