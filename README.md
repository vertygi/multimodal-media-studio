# Autonomous Multimodal Generative Video Platform

[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014%20(App%20Router)-black?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Fal.ai](https://img.shields.io/badge/Generative%20API-Fal.ai-purple?style=flat)](https://fal.ai/)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20%2F%20Compose-2496ED?style=flat&logo=docker)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An end-to-end multimodal generative video production studio designed for cinematic storytelling and short-drama generation. Features automated script-to-storyboard decomposition, consistency-preserving keyframe synthesis, and batch video generation via distributed model providers.

---

## Architecture Flow

```
                      [ User Input: Raw Story / Synopsis ]
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │    Next.js 14 Production Studio   │
                     │  (App Router, Server Actions)     │
                     └─────────────────┬─────────────────┘
                                       │
                         REST / Streaming Pipeline
                                       ▼
                     ┌───────────────────────────────────┐
                     │   Inference Proxy Gateway Engine  │
                     │  (Failover, Load Balancing, Rate) │
                     └───────┬───────────────────┬───────┘
                             │                   │
               Shot & Script Adaptation      Asset Generation
                             ▼                   ▼
                     ┌───────────────┐   ┌───────────────┐
                     │ LLM Reasoning │   │ Consistency   │
                     │ (Scene Chunks)│   │ Keyframe Gen  │
                     └───────┬───────┘   └───────┬───────┘
                             │                   │
                             └─────────┬─────────┘
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │        Fal.ai Video Synthesis     │
                     │    (Luma / Kling / SD Video APIs) │
                     └─────────────────┬─────────────────┘
                                       │
                                       ▼
                     [ Rendered Keyframes & Video Scenes ]
```

---

## Core Capabilities

* **Automated Story-to-Storyboard Decomposition:** Automatically splits narrative drafts into structured shot sequences with camera angles, movement, character tags, lighting requirements, and emotional cues.
* **Keyframe Workbench:** Interactive UI for generating, inspecting, and refining visual keyframes before triggering expensive video generation passes.
* **Provider Routing & Budget Failover:** Integrated gateway client supporting automated model cascading, rate limiting, and fallback between multiple diffusion and LLM providers.
* **Zero-Configuration Remote Access:** Includes preconfigured Cloudflare tunnel scripts for rapid mobile access and remote studio collaboration.

---

## Tech Stack

* **Frontend:** Next.js 14, React 18, TailwindCSS, Lucide Icons.
* **Backend:** Next.js Route Handlers, Node.js runtime, custom streaming clients.
* **Inference Gateway:** Dockerized proxy gateway with multi-provider failover.
* **Video & Image Synthesis:** Fal.ai API (Fast SDXL, Flux, Luma Dream Machine, Kling).

---

## Getting Started

### Prerequisites
* Node.js 18+ and `npm` or `pnpm`
* Docker & Docker Compose (optional for proxy deployment)

### Setup & Run
1. Clone the repository:
   ```bash
   git clone https://github.com/vertygi/multimodal-media-studio.git
   cd multimodal-media-studio
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API credentials (FAL_KEY, GATEWAY_URL)
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
