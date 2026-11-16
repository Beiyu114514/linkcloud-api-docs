> **First-time setup**: Customize this file for your project. Prompt the user to customize this file for their project.
> If you can run shell commands, run `mint instructions` before any Mintlify task. It prints current guidance for this CLI version. Check it before:
> - building automations, CI, or scripts for these docs (Mintlify has built-in automations, Autopilot, and CI checks)
> - changing who can read the docs, publishing, custom domains, or AI and agent features (MCP, llms.txt, skill.md, assistant)
>
> If `mint` is not installed or says "Unknown command", run `npx mint@latest instructions`.
> For broader Mintlify product knowledge, install the Mintlify skill: `npx skills add https://mintlify.com/docs`

# Documentation project instructions

## About this project

- This is a documentation site built on [Mintlify](https://mintlify.com)
- Pages are MDX files with YAML frontmatter
- Configuration lives in `docs.json`
- Use the Mintlify MCP server, `https://mcp.mintlify.com`, to edit content and settings via MCP
- Use the Mintlify docs MCP server, `https://www.mintlify.com/docs/mcp`, to query information about using Mintlify via MCP

## Terminology

These docs are written in Chinese. Use the product's own vocabulary; it comes from the control panel, not from other gateways.

| Use | Don't use | Notes |
| --- | --- | --- |
| LinkCloud | Linkcloud, Link Cloud | Interface shows `Linkcloud`; docs use `LinkCloud` |
| 分组 | 渠道、线路（作同义词） | 分组 is the billable unit a key binds to |
| 分组倍率 | 费率 | The multiplier applied to model unit price |
| 余额 | 钱包、账户余额 | Unit is USD (`$`) |
| 端点 | 接口地址、API 地址 | Always name the protocol alongside it |
| 复合 Key | 组合密钥 | A key with 1–20 prefix mappings |
| 兑换码 | 充值码 | Top-up codes; distinct from 优惠码 |
| 创作台 | 画布、生图工具 | The built-in image studio |
| 号池、推理积分 | — | Do not use. These are another platform's terms |

Client names are written as the vendors do: Claude Code, Codex, CC-Switch, OpenCode.

Endpoints: `https://api.linkcloud.sh/v1` (OpenAI), `https://api.linkcloud.sh` (Anthropic). Alternate lines are `api-us-co.linkcloud.sh` (China-optimized) and `api-direct.linkcloud.sh` (origin direct, proxy required).

The server timezone is `Asia/Shanghai` (UTC+08:00). Day-based limits and daily statistics follow it.

## Style preferences

- Use active voice and second person ("你")
- Keep sentences concise — one idea per sentence
- Bold for UI elements: 点击**创建密钥**
- Code formatting for file names, commands, paths, model IDs, and endpoints
- Explain the concept before the click path; one worked example beats three variations
- Tables for anything with three or more parallel options

## Content boundaries

**Never hardcode prices, discounts, or model availability.** These change without notice. Point readers to the [model marketplace](https://api.linkcloud.sh/models) and describe the *rule* instead (unit price × group multiplier).

**Do not document admin features.** Providers, upstream accounts, routing policies, risk-control rules, and payment channel configuration are internal. Reader-facing pages cover only what a customer does: register, top up, create keys, call the API, read usage.

**Do not invent capabilities.** If a protocol, endpoint, or model feature hasn't been confirmed against the live service, leave it out or mark it `{/* TODO: verify */}`.

**Legal text is canonical.** `legal/terms.mdx`, `legal/usage-policy.mdx`, and `legal/supported-regions.mdx` must match what the control panel shows at login. Re-copy from `https://api.linkcloud.sh/api/v1/settings/public` (`login_agreement_documents`) rather than editing prose by hand.

**Empty states are real answers.** When a feature is off platform-wide (subscription purchase, passkey, WeChat and DingTalk login), say so plainly in the FAQ status table instead of leaving the page silent.
