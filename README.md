# 逮龙虾户（delobjavu）

## 本地运行

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端（Vite） | **22000** | 浏览器打开 `http://127.0.0.1:22000` |
| 后端（FastAPI） | **22001** | 健康检查 `/api/health`；已登记 OpenClaw 节点 `/api/nodes` |

```bash
./start.sh
```

运行日志写入仓库根目录 **`.delobjavu/`**（已加入 `.gitignore`）：后端（含 uvicorn 访问日志）在 **`backend.log`**，前端 dev 输出在 **`frontend.log`**。`start.sh` 使用 `tee`，**终端里也会打印一份**，并追加到上述文件。

Docker Compose 里同样用 **`tee -a`**：既写入挂载的 **`.delobjavu/*.log`**，又送到容器 **stdout**，因此 **`docker logs <容器名>`** 能看到与文件一致的输出。

Docker（镜像：`python:3.12-slim-bookworm`、`node:22-bookworm-slim`）：`docker-compose.yml` 在仓库根目录，镜像构建文件分别为 **`backend/Dockerfile`**、**`frontend/Dockerfile`**。

```bash
docker compose up --build
```

### 后端目录结构

```
backend/
├── Dockerfile
├── app/
│   ├── main.py              # create_app()、挂载中间件与路由
│   ├── core/config.py       # 应用配置（标题、CORS 等）
│   ├── schemas/             # Pydantic 模型
│   ├── services/            # 业务与状态（如已登记 OpenClaw 节点）
│   └── api/
│       ├── deps.py          # Depends 依赖
│       └── routes/          # 按资源拆分的路由模块
├── requirements.txt
└── …
```

前端镜像对应 **`frontend/Dockerfile`**（与 `package.json` 同目录）。

启动入口：`uvicorn app.main:app`（工作目录为 `backend/`）。

---

**逮龙虾户**是一套调度层：把分布在**局域网**或**公网远端**上的 **OpenClaw Gateway / Node** 接进来，统一分发任务、回收结果、做健康与权限治理。本仓库当前为规划与实现入口；集成 OpenClaw 时，核心是对齐其 **Gateway 协议**，而不是自造一套私有 RPC。

---

## 你要解决什么问题

| 场景 | 说明 |
|------|------|
| 局域网 | 办公室/家里多台机器跑 OpenClaw Gateway + Node，逮龙虾户负责发现地址、鉴权、任务路由。 |
| 远端 | 云主机或分支办公室通过 TLS + Token 接入同一套 Gateway 或经逮龙虾户做聚合。 |

逮龙虾户本身不替代 OpenClaw 的执行能力；它更像是 **Operator 侧的编排与策略层**（或旁路控制面），与 Gateway 的 **WebSocket 控制面 + Node 能力声明**对齐。

---

## 集成前必须搞清楚的 OpenClaw 概念

### 1. Gateway 协议（必做功课）

OpenClaw 用 **WebSocket** 作为单一控制面与节点传输；文本帧里装 **JSON**，消息分 `event` / `req` / `res` 三类（握手、RPC、广播事件）。官方文档：[Gateway Protocol](https://docs.openclaw.ai/gateway/protocol)。

你需要至少理解：

- **握手**：Gateway 先发 `connect.challenge`（含 `nonce`），客户端再发 `method: "connect"`，成功则收到 `hello-ok`（含 `protocol` 版本与策略等）。
- **协议版本**：`minProtocol` / `maxProtocol` 与服务器必须匹配；版本定义在 OpenClaw 上游的协议 schema（文档中指向 `PROTOCOL_VERSION` / `schema.ts`）。
- **帧结构**：`type: "event" | "req" | "res"`，以及 idempotency、副作用类方法的约束（文档中有说明）。

### 2. 角色与能力（谁干活、谁指挥）

- **`operator`**：控制面（CLI / UI / 自动化）；带 `operator.read` / `operator.write` / `operator.admin` 等 **scopes**。
- **`node`**：能力宿主，在 `connect` 时声明 **`caps`**、**`commands`**、**`permissions`**（例如相机、屏幕、画布、`system.run` 等）。

逮龙虾户若要把远端 **OpenClaw Node** 当算力/工具池用，本质是：**以合规方式连上 Gateway，按 Node/Operator 能力做任务拆分与授权**，而不是绕过 Gateway 直接调模型。

### 3. 鉴权与设备身份（上线前就要设计）

文档要点包括：

- **`auth.token`**：与 Gateway 侧 `OPENCLAW_GATEWAY_TOKEN`（或等价配置）一致。
- **设备身份**：`connect` 需带 **`device`**（含对 `connect.challenge` 的签名）；新设备常涉及 **pairing / 审批**。
- **deviceToken**：`hello-ok` 里可能下发，客户端应持久化以便重连；失败时关注 `AUTH_TOKEN_MISMATCH` 等恢复提示。

生产环境还需考虑 **TLS**、可选 **证书指纹 pinning**（见官方文档 TLS 章节）。

### 4. 执行审批（若任务会触达本机执行）

涉及在 Node 上跑命令等场景时，Gateway 侧有 **`exec.approval.request` / `exec.approval.resolve`** 等流程；逮龙虾户若代理「批准」类操作，需要 **Operator 侧具备 `operator.approvals` 等 scope**，并理解广播事件语义。

---

## 建议的实施步骤（从调研到落地）

1. **固定 Gateway 拓扑**  
   明确：逮龙虾户是只连**一个** Gateway，还是多 Gateway 聚合；端口（默认常见为 **18789**，以实际部署为准）、是否 HTTPS/WSS。

2. **读协议与版本**  
   对照官方 [Gateway Protocol](https://docs.openclaw.ai/gateway/protocol)，列出你要用的 **method 列表**（会话、聊天、节点、审批等以你业务为准），并锁定 **protocol 版本**。

3. **实现最小 WS 客户端**  
   完成：`connect.challenge` → 签名 → `connect` → `hello-ok`；能稳定重连、处理鉴权错误与 device token 缓存。

4. **区分「调度逻辑」与「Gateway 能力」**  
   在逮龙虾户内实现：任务队列、节点选择（按 `caps`/`commands`）、超时与重试；**不要**重复实现 OpenClaw 已提供的会话与执行语义，尽量通过 Gateway 暴露的 API 调用。

5. **局域网发现（可选）**  
   mDNS/固定 IP / 内网 DNS / 配置文件；远端则侧重 **零信任**：TLS、Token 轮换、最小 scope。

6. **可观测与运维**  
   日志脱敏（Token、deviceToken）、连接数、各节点 `presence`、失败码与 `recommendedNextStep` 类提示的展示。

7. **安全评审**  
   避免 `dangerouslyDisableDeviceAuth` 类仅适合本机调试的开关进入生产；明确谁有权 `operator.admin`、谁可批执行。

---

## 文档与上游索引

- [Gateway Protocol（WebSocket）](https://docs.openclaw.ai/gateway/protocol) — 握手、角色、鉴权、设备签名、TLS。  
- OpenClaw 文档索引（便于让 LLM/工具爬全站）：`https://docs.openclaw.ai/llms.txt`  

实现细节以你安装的 **OpenClaw 版本**为准；升级 Gateway 时优先跑通协议版本与握手兼容性测试。

---

## 本仓库后续可放置的内容（可选）

- `docs/`：逮龙虾户自己的消息格式（若在与 Gateway 之外还有一层总线）。  
- `examples/`：最小 Operator 客户端或 Node 注册示例（仅作联调）。  
- 配置 schema：Gateway 地址、Token、TLS fingerprint、节点标签。

---

## 名称说明

**逮龙虾户**：本项目的调度与编排层产品名；英文标识 **delobjavu**（与仓库目录名 `dejavu` 可并存）。与 OpenClaw 官方术语对照见上文 **operator / node**（Gateway 协议里的角色与能力）。
