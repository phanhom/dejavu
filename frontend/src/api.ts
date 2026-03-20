export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export type Shrimp = {
  id: string;
  name: string;
  gateway_url: string | null;
  connection_status: ConnectionStatus;
  created_at: string;
};

const api = (path: string, init?: RequestInit) => fetch(path, init);

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await api("/api/health");
  if (!res.ok) throw new Error("health failed");
  return res.json();
}

export async function listShrimp(): Promise<Shrimp[]> {
  const res = await api("/api/shrimp");
  if (!res.ok) throw new Error("list failed");
  return res.json();
}

export async function createShrimp(body: {
  name: string;
  gateway_url?: string | null;
}): Promise<Shrimp> {
  const res = await api("/api/shrimp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: body.name,
      gateway_url: body.gateway_url?.trim() || null,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "create failed");
  }
  return res.json();
}

export async function deleteShrimp(id: string): Promise<void> {
  const res = await api(`/api/shrimp/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("delete failed");
}
