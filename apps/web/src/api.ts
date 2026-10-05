import { AgentProfile, ListSourcesResult, RunDetail, RunList, StartRunResponse } from "@loom/contracts";

async function request(path: string, options?: RequestInit): Promise<unknown> {
  const response = await fetch(`/api${path}`, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? body.message ?? `Request failed (${response.status})`);
  return body;
}
const post = (body = {}) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
export const api = {
  profile: async () => AgentProfile.parse(await request("/agent/profile")),
  sources: async () => ListSourcesResult.parse(await request("/sources")),
  runs: async () => RunList.parse(await request("/agent-runs")),
  detail: async (id: string, signal?: AbortSignal) =>
    RunDetail.parse(await request(`/agent-runs/${encodeURIComponent(id)}`, { signal })),
  start: async (task: string) => StartRunResponse.parse(await request("/agent-runs", post({ task }))),
  stop: async (id: string) =>
    StartRunResponse.parse(await request(`/agent-runs/${encodeURIComponent(id)}/stop`, post())),
};
