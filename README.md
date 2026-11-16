# LinkCloud 文档

[LinkCloud](https://api.linkcloud.sh) 的使用文档，基于 [Mintlify](https://mintlify.com) 构建。面向使用 LinkCloud API 的用户和开发者，不包含后台管理功能。

- 站点内容为简体中文
- 配置在 `docs.json`，页面是带 YAML frontmatter 的 MDX
- 写作规范与术语表见 [AGENTS.md](./AGENTS.md)

## 内容结构

| 目录 | 内容 |
| --- | --- |
| `index.mdx`、`quickstart.mdx`、`concepts.mdx`、`create-api-key.mdx` | 入门：产品介绍、接入流程、术语、密钥管理 |
| `endpoints.mdx`、`protocols.mdx`、`models.mdx` | API 接入：地址与线路、各协议示例、模型与分组清单 |
| `clients/` | Claude Code、Codex、CC-Switch、OpenCode、通用 curl |
| `account/` | 余额与计费、兑换码、用量与导出、团队、邀请返利 |
| `creative.mdx` | 创作台（网页生图） |
| `troubleshooting.mdx`、`errors.mdx`、`faq.mdx` | 排障、错误码、常见问题 |
| `legal/` | 服务条款、使用政策、支持的国家和地区 |

## 本地预览

```bash
npm i -g mint
mint dev
```

打开 http://localhost:3000 。修改文件后页面会自动刷新。

提交前建议跑一次检查：

```bash
mint validate
mint broken-links
```

## 内容来源

页面中的事实（端点、协议、分组、倍率、模型清单、功能开关、法律文本）均取自线上服务的公开接口：

| 来源 | 用途 |
| --- | --- |
| `GET https://api.linkcloud.sh/api/v1/settings/public` | 站点名称、端点、联系方式、功能开关、法律文本 |
| `GET https://api.linkcloud.sh/api/v1/marketplace/models` | 分组、倍率、模型清单、上下文与协议 |
| `GET https://api.linkcloud.sh/health` | 健康检查 |

**价格与折扣不写进文档。** 模型广场会实时变化，文档只解释计费规则，具体数字一律指向模型广场。

`models.mdx` 是按分组从 marketplace 接口生成的。分组或模型变动后重新生成，不要手工改表格里的一行。

## 待替换

以下资源目前是占位素材，上线前请换成官方素材：

- `logo/light.svg`、`logo/dark.svg` — 文字字标占位
- `favicon.svg` — 图标占位

## 发布

仓库接入 Mintlify 的 GitHub App 后，推送到默认分支即自动部署。自定义域名的配置见 [Mintlify 文档](https://mintlify.com/docs)。
