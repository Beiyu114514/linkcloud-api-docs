# docs.linkcloud.sh 部署说明

文档站点托管在 Mintlify，本目录放自定义域名的接入配置。

## 前置条件

1. **文档站点已经发布**。没有这一步就没有可代理的源站：

   ```bash
   mint login            # 需要在浏览器里完成授权
   mint config set subdomain <你的子域>
   mint status           # 确认 https://<你的子域>.mintlify.site 可访问
   ```

2. `docs.linkcloud.sh` 的 DNS 由你自己的 Cloudflare 管理。
3. `docs.json` 里的 `seo.metatags.canonical` 已指向 `https://docs.linkcloud.sh`。

## 两条路线

| | A. CNAME 直连（推荐） | B. 自建反向代理 |
| --- | --- | --- |
| 做法 | `docs.linkcloud.sh` CNAME 到 `cname.mintlify.builders` | 自己的 Cloudflare Worker / nginx 转发到 `<子域>.mintlify.site` |
| TLS | Mintlify 自动签发 | 你自己的证书 |
| 支持的官方路径 | 是 | Mintlify 官方只提供 **子路径**（`example.com/docs`）的反向代理方案，整站子域代理属于非标准用法 |
| 适合 | 只想要一个文档域名 | 想把流量留在自己的 Cloudflare 里，接 WAF、限流、访问日志 |
| 风险 | 需要 Cloudflare 侧用「DNS only」或 Full (strict) | CSP、分析上报、重定向的 Host 处理都要自己保证 |

**如果只是要把文档放到 `docs.linkcloud.sh`，选 A。** 它由 Mintlify 处理证书和路由，没有需要维护的中间层。

选 B 时继续往下看。

## 路线 A：CNAME

1. 在 Mintlify 注册域名：

   ```bash
   mint add-domain docs.linkcloud.sh
   ```

   或在仪表盘的 Custom domain setup 页面添加。

2. 按输出添加 DNS 记录，顺序不能颠倒：

   - 先加 `TXT _acme-challenge` 和 `TXT _cf-custom-hostname`，等两者都通过校验。
   - **校验通过后**再加 `CNAME docs.linkcloud.sh → cname.mintlify.builders`。提前切换会导致 HTTPS 在证书签发完成前一直不可用。

3. Cloudflare 侧设置：

   - SSL/TLS 模式用 **Full (strict)**，并关闭 **Always Use HTTPS**。
   - 灰云（DNS only）可以做到零中断；橙云（Proxied）会跳过 TXT 先行校验，证书签发期间会短暂报证书错误。
   - CAA 记录里要允许 `0 issue "letsencrypt.org"`。
   - 不要重写或重定向 `/.well-known/acme-challenge`。

4. DNS 生效通常 1–24 小时，证书紧随其后（最长 24 小时）。

5. 验证：

   ```bash
   curl -sS https://docs.linkcloud.sh | head -c 300
   ```

## 路线 B：自建反向代理

### Cloudflare Worker

`cloudflare-worker.js` 是可直接使用的 Worker 脚本。把 `SUB` 换成你的 Mintlify 子域，然后：

1. 新建 Worker，粘贴脚本。
2. 给 Worker 添加路由 `docs.linkcloud.sh/*`。
3. 该主机的 DNS 记录指向 Worker（橙云）。
4. 在 Cloudflare 上给这个主机名准备证书。

Worker 使用绝对 URL 请求上游，因此 `Host` 会自动变成 `<子域>.mintlify.site`，无需（也无法）手工设置 `Host` 请求头。

### nginx

`nginx-docs.conf` 是等价的自建 nginx 配置，适用于流量先到你自己服务器的场景。

要点：

- 代理目标是 `<子域>.mintlify.site`，`proxy_set_header Host` 要设成上游主机名，**不要**透传原始 `Host`。
- 转发全部 HTTP 方法：分析上报是 `POST /_mintlify/api/...`，只放行 GET/HEAD 会丢失分析数据。
- 转发 `X-Forwarded-For`、`X-Forwarded-Proto`、`X-Real-IP`、`User-Agent`。
- 不缓存页面；只缓存 `/mintlify-assets/_next/static/` 下的静态资源。
- 不要改写 `/.well-known/` 下的路径。

### 代理路线的已知注意点

- **CSP**：Mintlify 由自己的响应头下发 CSP。如果中间层覆盖了 CSP，需要放行 `*.mintlify.site`、`*.mintlify.com`、`mintcdn.com`、`*.mintcdn.com` 以及验证码域名，否则页面会出现脚本或资源被拦截。
- **默认地址仍可访问**：加了自定义域名后，`<子域>.mintlify.site` 仍然可访问且可被收录。用 CNAME 接入时可以让支持关闭它，用反向代理接入时不行。因此必须依赖 `seo.metatags.canonical` 指向正式域名。
- **WAF / Bot Fight Mode**：如果拦截了 `/mintlify-assets/`，需要加一条跳过规则。
- **重定向**：上游返回的 `Location` 如果指向 `<子域>.mintlify.site`，Worker 会改写成正式域名；如果用 nginx，需要在 `proxy_redirect` 里处理。

## 验证清单

```bash
curl -sS -I https://docs.linkcloud.sh
curl -sS https://docs.linkcloud.sh | head -c 300
curl -sS https://docs.linkcloud.sh/llms.txt | head -5
```

浏览器里还要确认：

- 控制台没有 CSP 报错，没有 `/mintlify-assets/` 403。
- 页面能正常访问，搜索、上下文菜单可用。
- 分析能记录访问（代理方案下最容易漏掉的一环）。
- 页面源码里的 canonical 指向 `https://docs.linkcloud.sh`。
