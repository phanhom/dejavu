export type ConnectionStatus = "disconnected" | "connecting" | "connected";

/** 已登记的 OpenClaw 侧节点（与浏览器 DOM Node 区分命名） */
export type OpenClawNode = {
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

export async function listNodes(): Promise<OpenClawNode[]> {
  const res = await api("/api/nodes");
  if (!res.ok) throw new Error("list failed");
  return res.json();
}

export async function createNode(body: {
  name: string;
  gateway_url?: string | null;
}): Promise<OpenClawNode> {
  const res = await api("/api/nodes", {
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

export async function deleteNode(id: string): Promise<void> {
  const res = await api(`/api/nodes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("delete failed");
}
