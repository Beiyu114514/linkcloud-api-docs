# docs.linkcloud.sh 部署说明

文档站点托管在 Mintlify，本目录放自定义域名的接入配置。

> **本项目采用路线 A：CNAME 直连。** 路线 B 的两个配置文件（`cloudflare-worker.js`、`nginx-docs.conf`）保留在 `deploy/` 下作为备选，当前未启用。

## 前置条件

- `docs.linkcloud.sh` 的 DNS 由你自己的 Cloudflare 管理。
- `docs.json` 里的 `seo.metatags.canonical` 已指向 `https://docs.linkcloud.sh`。

## 两条路线

| | A. CNAME 直连（本项目采用） | B. 自建反向代理（备选，未启用） |
| --- | --- | --- |
| 做法 | `docs.linkcloud.sh` CNAME 到 `cname.mintlify.builders` | 自己的 Cloudflare Worker / nginx 转发到 `<子域>.mintlify.site` |
| TLS | Mintlify 自动签发 | 你自己的证书 |
| 官方支持 | 是 | Mintlify 官方只提供**子路径**（`example.com/docs`）的反向代理方案，整站子域代理属于非标准用法 |
| 适合 | 只想要一个文档域名 | 想把流量留在自己的 Cloudflare 里，接 WAF、限流、访问日志 |
| 代价 | Cloudflare 侧需用灰云或 Full (strict) | CSP、分析上报、重定向的 Host 处理都要自己保证 |

只需要把文档放到 `docs.linkcloud.sh` 时，用路线 A：证书和路由都由 Mintlify 处理，没有中间层要维护。

## 路线 A：CNAME

### 1. 登录并发布站点

**在你自己的终端里执行。** 远程或云会话中浏览器授权无法回调到当前机器。

```bash
mint login
```

命令会打开授权页面。浏览器没有自动打开时，复制它打印的 URL，在浏览器里完成授权，再把页面给出的授权码粘贴回终端。

登录后发布站点：

```bash
mint config set subdomain <你的子域>
mint status
```

`mint status` 会打印 `https://<你的子域>.mintlify.site`。先确认这个地址能打开，再继续。

### 2. 注册自定义域名

```bash
mint add-domain docs.linkcloud.sh
```

也可以走仪表盘的 Custom domain setup 页面。

### 3. 按顺序添加 DNS 记录

**顺序不能颠倒。** 提前切换 CNAME 会让 HTTPS 在证书签发完成前一直不可用。

1. 先加 `TXT _acme-challenge.docs.linkcloud.sh` 与 `TXT _cf-custom-hostname.docs.linkcloud.sh`，等两项都通过校验。
2. 校验通过后再加 `CNAME docs.linkcloud.sh → cname.mintlify.builders`。

记录值以 `mint add-domain` 或仪表盘打印的内容为准；命令暂时没有打印时，在仪表盘里读取。

### 4. 设置 Cloudflare

- SSL/TLS 模式：**Full (strict)**
- **关闭** Always Use HTTPS
- CAA 记录需包含 `0 issue "letsencrypt.org"`
- 不要重写或重定向 `/.well-known/acme-challenge`

| 模式 | 效果 |
| --- | --- |
| 灰云（DNS only） | 零中断，TXT 校验与证书签发均正常 |
| 橙云（Proxied） | 跳过 TXT 先行校验，证书签发期间会短暂报证书错误 |

卡在 TXT 校验时，修好记录后在仪表盘点 **Retry validation**。

### 5. 等待生效

DNS 通常 1–24 小时（最长 48 小时），TLS 证书紧随其后（最长 24 小时）。

### 6. 验证

```bash
dig +short CNAME docs.linkcloud.sh        # 预期 cname.mintlify.builders
curl -sS -I https://docs.linkcloud.sh
curl -sS https://docs.linkcloud.sh | head -c 300
curl -sS https://docs.linkcloud.sh/llms.txt | head -5
```

浏览器里确认：页面正常打开，搜索可用，页面源码里的 `canonical` 指向 `https://docs.linkcloud.sh`。

## 路线 B：自建反向代理（备选，未启用）

### Cloudflare Worker

`cloudflare-worker.js` 是可直接使用的 Worker 脚本。把 `UPSTREAM_HOST` 换成你的 Mintlify 子域，然后：

1. 新建 Worker，粘贴脚本，保存并部署。
2. 添加路由 `docs.linkcloud.sh/*`。
3. 该主机名的 DNS 记录指向 Worker（橙云）。
4. 在 Cloudflare 上准备这个主机名的证书。

Worker 用绝对 URL 请求上游，因此 `Host` 会自动变成 `<子域>.mintlify.site`，无需（也无法）手工设置 `Host` 请求头。

### nginx

`nginx-docs.conf` 是等价的自建 nginx 配置，适用于流量先到你自己服务器的场景。

要点：

- 代理目标是 `<子域>.mintlify.site`，`proxy_set_header Host` 设成上游主机名，**不要**透传原始 `Host`。
- 转发全部 HTTP 方法：分析上报是 `POST /_mintlify/api/...`，只放行 GET/HEAD 会丢失分析数据。
- 转发 `X-Forwarded-For`、`X-Forwarded-Proto`、`X-Real-IP`、`User-Agent`。
- 不缓存页面，只缓存 `/mintlify-assets/_next/static/`。
- 不要改写 `/.well-known/` 下的路径。

### 代理路线的已知注意点

- **CSP**：Mintlify 由自己的响应头下发 CSP。中间层若覆盖了 CSP，需要放行 `*.mintlify.site`、`*.mintlify.com`、`mintcdn.com`、`*.mintcdn.com` 以及验证码域名，否则会出现脚本或资源被拦截。
- **默认地址仍可访问**：加了自定义域名后，`<子域>.mintlify.site` 仍可访问且可被收录。用 CNAME 接入时可以让支持关闭它，用反向代理接入时不行，因此必须依赖 `seo.metatags.canonical`。
- **WAF / Bot Fight Mode**：若拦截了 `/mintlify-assets/`，需要加一条跳过规则。
- **重定向**：上游返回的 `Location` 若指向 `<子域>.mintlify.site`，Worker 会改写成正式域名；nginx 需要在 `proxy_redirect` 里处理。
- **分析**：代理方案下最容易漏掉的是 `/_mintlify/api/` 的 POST 上报。上线后在仪表盘确认能看到访问数据。

## 参考

- [Mintlify 自定义域名](https://www.mintlify.com/docs/customize/custom-domain)
- [Mintlify 反向代理](https://www.mintlify.com/docs/deploy/reverse-proxy)
- [Mintlify CSP 配置](https://www.mintlify.com/docs/deploy/csp-configuration)
