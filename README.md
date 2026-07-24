# 🛡️ Triage

> **OTel-Powered Blue Team SOC**  
> *Built for the Agents of SigNoz Hackathon — Track 3: Observe Anything Weird*  
> **Developed by [CodeWithMehru](https://github.com/CodeWithMehru)**

---

## 🎯 The Hackathon Pitch (Track 3: Observe Anything Weird)

> *"While everyone else uses OpenTelemetry to monitor standard CPU usage, latency, and memory, no one is observing the real 'weird' stuff: **Cyber Attacks**. In this AI era, security is paramount. We built **Triage** as a Blue Team SOC to observe hackers, not just hardware. This makes it a highly unique, security-first use-case for SigNoz."*

Traditional observability platforms treat security incidents as generic `403` or `500` HTTP status spikes or unhandled application errors. They leave Blue Teams blind to crucial questions:
- *Who is actively probing your attack surface right now?*
- *What specific exploit payload or secret pattern was attempted?*
- *What was the attacker's ultimate goal?*

**Triage** bridges standard APM and enterprise CyberSecurity. It transforms OpenTelemetry traces into actionable real-time threat intelligence by capturing exploit payloads, analyzing them with fast LLMs via Groq, automatically triggering perimeter IP bans via SRE Sidekick, and streaming rich telemetry directly into **SigNoz**.

---

## ✨ Key Features

### 🧠 1. AI-Powered Threat Analysis (Groq / Llama-3)
* **Real-time Attack Explanation**: Intercepts malicious web vectors (**SQL Injection**, **XSS**, **Sensitive Data Leaks**) and feeds raw payloads to **Groq (Llama-3.1)**.
* **Detailed 3-Sentence Summary**: Synthesizes a structured, consistent 3-sentence breakdown covering the payload structure, technical attack mechanism, and security impact.
* **Embedded Telemetry**: Injects the AI explanation directly into OpenTelemetry trace spans under `threat.goal`, accompanied by `llm.latency`, `llm.model`, and `llm.token_usage`.

### 🛡️ 2. SRE Sidekick (Self-Healing Auto-Ban)
* **Automated Defense Mechanism**: Continuously tracks attack frequency per source IP. If an attacker strikes **5 times within 60 seconds**, the system automatically bans their IP address.
* **Instant Perimeter Enforcement**: Rejects subsequent request attempts from banned IPs with `403 IP_AUTO_BANNED`.
* **Critical Dashboard Alerts**: Generates a `sre.auto_ban.triggered` OTel span and pushes a high-priority **CRITICAL ALERT** banner directly to the SOC Dashboard.

### 🪤 3. TCP Honeypot Trap
* **Reconnaissance Detection**: A Python `asyncio` honeypot listening on **Port 2222** (SSH) and **Port 63790** (Redis) to catch background scanners (e.g., Nmap, Shodan).
* **Fake Banners & Probe Tracing**: Responds with realistic service headers while outputting OpenTelemetry spans tagged `security.threat_type = "PORT_SCAN"` to trace reconnaissance activity.

### ⏱️ 4. Data Leak Detector & CPU Tarpit
* **Payload Pattern Engine**: Deep regex scanner evaluating query strings, body parameters, headers, and authorization tokens for leaked API keys (`sk-...`), AWS keys, SQLi, and XSS.
* **Resource Exhaustion Countermeasure**: Malicious probes hit a configurable CPU tarpit delay (500ms default) prior to receiving a `403 Forbidden` response, burning attacker resources while shielding backend services.

### 🖥️ 5. Cyberpunk SOC Command Center
* **Unified Observability UI**: Next.js 16 dashboard merging real-time SigNoz telemetry traces, historical Supabase threat records, auto-scrolling terminal feeds, threat stats, and auto-ban alert streams.
* **Database Maintenance**: Features a `POST /api/threats/clear` endpoint and header action to reset event logs during live demonstrations.

---

## ⚡ How We Used SigNoz & OpenTelemetry (The Core Tech)

Triage redefines OpenTelemetry usage by **tracing threat actors across the complete attack lifecycle**:

1. **Custom Security Spans**:
   - `security.trap`: Triggered upon identifying web exploit payloads.
   - `ai.payload.analysis`: Measures LLM reasoning time and token consumption.
   - `sre.auto_ban.triggered`: Emitted when rate limits exceed threat thresholds.
   - `honeypot.port_scan`: Captures TCP connection probes.

2. **Custom Security Attributes**:
   - `security.severity` (`CRITICAL`, `WARN`)
   - `security.threat_type` (`SQL_INJECTION`, `XSS`, `SENSITIVE_DATA_LEAK`, `PORT_SCAN`, `AUTO_BAN`)
   - `security.source_ip`, `security.matched_pattern`, `http.status_code`
   - `llm.latency`, `llm.model`, `threat.goal`

3. **Hack Lifecycle Tracing**: Maps an adversary's footprint from initial TCP port scan probes (`sentinel-honeypot`) to web exploitation attempts (`sentinel-trap-api`), through AI contextualization, up to automated defense isolation (`sre.auto_ban.triggered`).

---

## 🏗️ Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                                 ATTACK SURFACE                                    |
|   +--------------------------+                 +------------------------------+   |
|   |   API Abuser / Exploit   |                 |   Nmap / Shodan Port Scanner |   |
|   +------------+-------------+                 +--------------+---------------+   |
+----------------|----------------------------------------------|-------------------+
                 | (HTTP / API)                                 | (TCP Connection)
                 v                                              v
+------------------------------------+        +-------------------------------------+
|      Next.js / Node Trap API       |        |       Python asyncio Honeypot       |
|    (securityTrapMiddleware)        |        |           (:2222 / :63790)          |
+----------------+-------------------+        +-----------------+-------------------+
                 |                                              |
       +---------+---------+                                    |
       |                   |                                    |
       v                   v                                    |
+--------------+    +--------------+                            |
|  Groq LLM    |    |   Supabase   |                            |
| (Llama-3.1)  |    |  (Postgres)  |                            |
+------+-------+    +------+-------+                            |
       |                   |                                    |
       +---------+---------+                                    |
                 |                                              |
                 v (OTLP HTTP :4318)                            v (OTLP HTTP :4318)
+-----------------------------------------------------------------------------------+
|                           SIGNOZ OPENTELEMETRY COLLECTOR                          |
|                             (ClickHouse + Query Engine)                           |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                             LIVE SOC DASHBOARD (Next.js)                          |
|              (Real-Time Telemetry Feed, Threat Stats & Auto-Ban Alerts)           |
+-----------------------------------------------------------------------------------+
```

---

## 🚨 Simulate Attacks (Demo Commands for Judges)

Run these test commands from your terminal or Kali Linux machine to simulate attack vectors and verify live telemetry in the SOC Dashboard and SigNoz:

### 1. SQL Injection Attack
```bash
curl "http://localhost:3001/api/search?q=%27%20OR%201%3D1--"
```
*(Triggers 403 Forbidden, tarpit delay, and AI threat analysis span)*

### 2. Sensitive Data Exfiltration (Shadow AI Leak)
```bash
curl -X POST http://localhost:3001/api/search -H "Content-Type: application/json" -d '{"key":"sk-1234567890abcdefghijklmnopqrstuvwxyz"}'
```
*(Triggers 403 Forbidden and Groq AI key-leak analysis)*

### 3. Reconnaissance (Port Scan)
```bash
nc localhost 2222
```
*(Triggers Python honeypot span on Port 2222 with `PORT_SCAN` threat classification)*

### 4. Trigger SRE Auto-Ban (Self-Healing Defense)
```bash
for i in {1..6}; do curl -s "http://localhost:3001/api/search?q=%27%20OR%201%3D1--"; sleep 1; done
```
*(Triggers 5 attacks in 60s -> SRE Sidekick issues 24h IP auto-ban & CRITICAL alert banner)*

---

## 💻 Tech Stack

| Component | Technology |
|-----------|------------|
| **Trap Engine** | Node.js, Express, TypeScript, OpenTelemetry SDK |
| **Honeypot Fleet** | Python 3.11+, asyncio, OpenTelemetry Python SDK |
| **AI Threat Analyzer** | Groq API (`llama-3.1-8b-instant`) |
| **Observability** | SigNoz (self-hosted Docker), OTLP HTTP `:4318` |
| **State Persistence** | Supabase (PostgreSQL) |
| **SOC Dashboard** | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| **Environment** | Linux / Kali Linux |

---

## ⚙️ Setup Instructions

### 1. Clone & Configure Environment

```bash
cd Sentinel
cp .env.example .env
# Edit .env with your Supabase URL, Service Role Key, and Groq API Key
```

### 2. Start SigNoz (Self-Hosted)

```bash
git clone https://github.com/SigNoz/signoz.git
cd signoz/deploy
docker compose up -d
```

Access SigNoz services:
- **SigNoz UI**: `http://localhost:3301`
- **OTLP HTTP Collector**: `http://localhost:4318`
- **Query API**: `http://localhost:8080`

### 3. Supabase Database Migration

Execute the database migration via Supabase SQL Editor or CLI:

```bash
supabase db push
```

Migration file: [`supabase/migrations/20260723100000_threat_events.sql`](supabase/migrations/20260723100000_threat_events.sql)

Ensure `.env` contains:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Start the Trap API

```bash
cd api
npm install
npm run dev
```
*(Runs at `http://localhost:3001`)*

### 5. Start the Honeypot Fleet

```bash
cd honeypot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```
*(Listens on Port `2222` for SSH probes and Port `63790` for Redis probes)*

### 6. Start the SOC Dashboard

```bash
cd dashboard
npm install
npm run dev
```
*(Runs at `http://localhost:3000`)*

---

## 🔍 SigNoz Query Builder Guide

Filter and analyze security traces inside **SigNoz Traces Explorer**:

* **CRITICAL Security Trap Hits**:
  ```
  http.status_code = 403 AND security.severity = 'CRITICAL'
  ```
* **SQL Injection Traces**:
  ```
  security.threat_type = 'SQL_INJECTION' AND http.status_code = 403
  ```
* **AI Analysis Spans**:
  ```
  name = 'ai.payload.analysis'
  ```
  *(Inspect attributes: `threat.goal`, `llm.latency`, `llm.model`)*
* **SRE Auto-Ban Spans**:
  ```
  name = 'sre.auto_ban.triggered'
  ```
  *(Inspect attributes: `banned_ip`, `attack_count`, `trigger_threshold`)*
* **Honeypot Port Scans**:
  ```
  service.name = 'sentinel-honeypot' AND security.threat_type = 'PORT_SCAN'
  ```

---

## 📂 Project Structure

```
Sentinel/
├── api/                 # Node.js Trap API Engine (Express + OTel)
├── honeypot/            # Python TCP Honeypot Fleet (asyncio + OTel)
├── dashboard/           # Next.js Cyberpunk SOC Dashboard
├── supabase/migrations/ # PostgreSQL Threat Intel Schema
├── .env.example
└── README.md
```

---

## 👨‍💻 Author & Credits

Developed by **[CodeWithMehru](https://github.com/CodeWithMehru)** for the **Agents of SigNoz Hackathon (Track 3)**.

*License: MIT*
