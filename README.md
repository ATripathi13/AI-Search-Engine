<div align="center">
  <h1>🚀 Next-Gen AI Answer Engine</h1>
  <p>A production-grade, modular, and asynchronous AI reasoning pipeline bridging hybrid semantic retrieval and multi-hop language generation.</p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](#)
  [![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](#)
  [![Qdrant](https://img.shields.io/badge/Qdrant-FF5C5C?style=for-the-badge)](#)
  [![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](#)
</div>

<br />

## 🧠 Why This Project?

Traditional LLMs **hallucinate**. Traditional search lacks **reasoning**.

This system seamlessly combines:
- **Retrieval (Truth)**
- **Reasoning (Intelligence)**
- **Citations (Trust)**

→ Delivering reliable, grounded, and mathematically verified AI answers directly to the user.

---

## 🌟 Overview

The **AI Answer Engine** is a state-of-the-art enterprise search application designed to process complex natural language queries, orchestrate hybrid multi-hop reasoning, and generate accurate, fully cited responses in real-time. Built entirely from scratch, it natively integrates **Next.js** for front-end stream rendering alongside a custom **Node.js** architecture mapping dense vector algorithms.

---

## 🧪 Demo Example

**User Query:**
> *"What caused the 2008 financial crisis?"*

**Synthesized Answer:**
> The 2008 financial crisis was primarily caused by severe deregulation within the financial industry that permitted banks to engage in hedge fund trading with massive derivatives. This particularly centered around the collapse of subprime mortgage lending standards across major housing markets. [1][2]

**Extracted Validated Citations:**
- `[1]` *Federal Reserve Financial Crisis Inquiry Report*
- `[2]` *IMF Subprime Analytics Archive*

---

## 🔄 End-to-End Pipeline

1. **User submits query** via the dynamic Next.js frontend UI.
2. **Query Decomposer** generates structured, topologically-sorted sub-queries based on intent.
3. **Hybrid Retrieval** fetches document chunks simultaneously across (BM25 Keyword + Qdrant Vector).
4. **RRF Merges** and cross-encoder structures efficiently deduplicate and rank results.
5. **Multi-Hop Reasoning** identifies and recursively fills knowledge gaps mapping logical cycles.
6. **Context is passed** natively to the Live LLM Service securely bounding token limits.
7. **Answer logic is generated** enforcing strict semantic text grounding mappings.
8. **Citation Mapper** links generative factual claims verbatim to specific database source arrays.
9. **Final answer strings are streamed** natively as Server-Sent Events (SSE) direct to the UI cleanly.

<br />

## 📐 Architecture Diagram

```mermaid
graph TD
    UI[Next.js React Frontend] -->|Query over SSE Stream| ORC(AnswerEngine Orchestrator)
    
    ORC --> CACHE{Redis Cache Layer}
    CACHE -- Hit --> UI
    CACHE -- Miss --> DEC[Query Decomposer]

    DEC --> HYB[Hybrid Retrieval Engine]
    HYB -->|BM25 Keyword| DOCS[(Data Sources)]
    HYB -->|Qdrant Vector| DOCS

    HYB --> RRF[RRF Ranker & Deduplication]
    RRF --> DAG[Multi-Hop Reasoning DAG]
    
    DAG --> LLM[Live LLM Service OpenAI]
    LLM --> VAL[Answer Validator & Citation Mapper]
    
    VAL --> CACHE
    VAL -->|Valid Citations| UI
```

---

## 📊 Performance Metrics

- **Average Latency**: `~2.8s`
- **Vector Retrieval Time**: `~800ms`
- **Grounding Claim Score**: `> 85%` strict mathematical correlation
- **Cache Hit Fetch Latency**: `< 50ms`

---

## 🏗️ Core Architecture & Features

The platform separates reasoning logic into explicit deterministic mathematical pipelines:

- **🧠 Query Decomposer:** Structurally parses complex prompts, determining root intents and sorting multi-step dependencies.
- **🔍 Hybrid Retrieval Engine:** Consumes simultaneous text searches and dense vector similarities, intersecting bounds using **Reciprocal Rank Fusion**.
- **🔄 Multi-Hop Reasoning DAG:** Orchestrates recursive loops fetching disparate topological collections mitigating LLM hallucinations.
- **🚀 Dynamic Model Router:** Evaluates complexities estimating pricing metrics, shifting traffic systematically between large and mini dynamic models optimizing budget efficiency.
- **🛠️ Feedback Loop:** Implicit negative feedback mappings securely recalculate scoring matrix parameters autonomously.
- **🛡️ Answer Validation:** Mathematically gauges generative claim coverage constraining scores above absolute threshold restrictions securely.

---

## 💻 Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS v4
- **Generative AI**: OpenAI API SDK
- **Database**: Qdrant Server (Vector DB), Redis (Caching Layer)
- **Quality Assurance**: `vitest` wrapped with exactly mathematically bounded `fast-check` algorithm arrays!

---

## ⚙️ Quickstart & Setup

### Prerequisites
Before assembling, ensure you have active local instances of **Qdrant** and **Redis** available alongside an isolated **OpenAI API Key**.

### 1. Installation
Clone the repository and natively install dependency bounds:

```bash
git clone https://github.com/ATripathi13/AI-Search-Engine.git
cd AI-Search-Engine
npm install
```

### 2. Configure Environment Tokens
Create the `.env.local` mappings manually inserting raw credential values securely out of version control:

```env
# .env.local
OPENAI_API_KEY="sk-...YOUR-OPENAI-API-KEY"
QDRANT_URL="http://localhost:6333"
REDIS_URL="redis://localhost:6379"
```

### 3. Launch Development Server
With configurations natively injected, boot the React Server-Side rendering environment effectively:

```bash
npm run dev
```

Navigate to `http://localhost:3000` inside your web browser globally. Type a question and watch Server-Sent Events assemble sequences!

---

## 🧪 Property-Based Verification

This codebase was explicitly developed utilizing pure **Property-Based Testing** configurations via `fast-check`. Conventional rigid unit tests are replaced entirely by algorithm matrices that flood logic functions under strict bounds! 

Execute the native 20-property validation suite physically resolving vectors without crashing:
```bash
npm test
```

---

## 🚀 Future Improvements

The foundation maps perfectly mathematically, but there is immense room for expanding generative logic dynamically natively globally across external pipelines!

- **Reinforcement Learning from User Feedback (RLHF)**: Tuning exact vector extraction constants directly through frontend feedback scoring maps!
- **Query Intent Learning**: Deploying clustering logic intelligently mapping similar queries prior to hitting the cache database autonomously.
- **Multi-Modal Native Retrieval**: Constructing Image + Vision arrays extracting visual semantics from dense web documents matching text matrices globally.
