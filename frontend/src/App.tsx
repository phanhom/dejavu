import { useCallback, useEffect, useState } from "react";
import {
  createNode,
  deleteNode,
  fetchHealth,
  listNodes,
  type OpenClawNode,
} from "./api";

type BackendState = "unknown" | "up" | "down";

function statusLabel(s: OpenClawNode["connection_status"]) {
  switch (s) {
    case "connected":
      return "已连接";
    case "connecting":
      return "连接中";
    default:
      return "未连接";
  }
}

function statusStyle(s: OpenClawNode["connection_status"]) {
  switch (s) {
    case "connected":
      return "bg-neutral-900 text-white";
    case "connecting":
      return "bg-neutral-500 text-white";
    default:
      return "bg-neutral-200 text-neutral-800";
  }
}

export default function App() {
  const [backend, setBackend] = useState<BackendState>("unknown");
  const [items, setItems] = useState<OpenClawNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [gatewayUrl, setGatewayUrl] = useState("");

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await fetchHealth();
      setBackend("up");
    } catch {
      setBackend("down");
    }
    try {
      const list = await listNodes();
      setItems(list);
    } catch {
      setItems([]);
      setBackend((b) => (b === "up" ? "down" : b));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 8000);
    return () => window.clearInterval(t);
  }, [refresh]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createNode({
        name: name.trim(),
        gateway_url: gatewayUrl.trim() || null,
      });
      setName("");
      setGatewayUrl("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加失败");
    } finally {
      setLoading(false);
    }
  }

  async function onRemove(id: string) {
    setLoading(true);
    setError(null);
    try {
      await deleteNode(id);
      await refresh();
    } catch {
      setError("删除失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10">
      <header className="mb-10 border-b border-neutral-300 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          delobjavu
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
          逮龙虾户
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
          登记局域网或远端的 OpenClaw Gateway
          节点。当前仅保存列表与连接状态占位，与 Gateway 的联动后续再接。
        </p>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <span className="text-neutral-500">后端</span>
          <span
            className={
              backend === "up"
                ? "rounded-full border border-neutral-900 bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-white"
                : backend === "down"
                  ? "rounded-full border border-neutral-400 bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-800"
                  : "rounded-full border border-neutral-300 bg-white px-2.5 py-0.5 text-xs font-medium text-neutral-600"
            }
          >
            {backend === "up"
              ? "在线"
              : backend === "down"
                ? "离线"
                : "检测中"}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded border border-neutral-400 bg-white px-2 py-1 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            刷新
          </button>
        </div>
      </header>

      <section className="mb-10 rounded-lg border border-neutral-300 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-900">添加节点</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium text-neutral-600"
            >
              名称
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：办公室 OpenClaw 节点 A"
              className="mt-1 w-full rounded border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none ring-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1"
              autoComplete="off"
            />
          </div>
          <div>
            <label
              htmlFor="gw"
              className="block text-xs font-medium text-neutral-600"
            >
              Gateway URL（可选）
            </label>
            <input
              id="gw"
              value={gatewayUrl}
              onChange={(e) => setGatewayUrl(e.target.value)}
              placeholder="wss://host:18789 预留"
              className="mt-1 w-full rounded border border-neutral-300 bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1"
              autoComplete="off"
            />
          </div>
          {error ? (
            <p className="text-xs text-neutral-700">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading || !name.trim() || backend !== "up"}
            className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {loading ? "提交中…" : "添加"}
          </button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold text-neutral-900">节点列表</h2>
          <span className="text-xs text-neutral-500">{items.length} 条</span>
        </div>
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
            还没有节点。先确保后端在线，再添加一条。
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-300 bg-white">
            {items.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-neutral-900">{s.name}</p>
                  {s.gateway_url ? (
                    <p className="mt-0.5 font-mono text-xs text-neutral-500">
                      {s.gateway_url}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {s.created_at}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle(s.connection_status)}`}
                  >
                    {statusLabel(s.connection_status)}
                  </span>
                  <button
                    type="button"
                    disabled={loading || backend !== "up"}
                    onClick={() => void onRemove(s.id)}
                    className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                  >
                    移除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-auto pt-12 text-center text-[11px] text-neutral-400">
        黑白灰界面 · React · Tailwind · FastAPI
      </footer>
    </div>
  );
}
