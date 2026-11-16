/**
 * docs.linkcloud.sh -> Mintlify 托管地址 的反向代理 Worker
 *
 * 用法：
 *   1. 把 UPSTREAM_HOST 换成你的 Mintlify 子域（mint status 会显示）。
 *   2. 新建 Worker，粘贴本脚本，保存并部署。
 *   3. 添加路由：docs.linkcloud.sh/*
 *   4. 该主机名的 DNS 记录指向 Worker（Cloudflare 代理开启）。
 *
 * 说明：
 *   - Worker 用绝对 URL 请求上游，Host 会自动变成 UPSTREAM_HOST，
 *     无需也无法手工设置 Host 请求头。
 *   - 必须转发全部 HTTP 方法：分析上报是 POST /_mintlify/api/...
 *     只放行 GET/HEAD 会让分析数据丢失。
 *   - 不要改写 /.well-known/ 下的路径，否则证书校验会失败。
 */

const UPSTREAM_HOST = "SUB.mintlify.site"; // TODO: 换成你的 Mintlify 子域
const UPSTREAM = `https://${UPSTREAM_HOST}`;
const PUBLIC_HOST = "docs.linkcloud.sh";

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

function rewriteUpstreamOrigin(value) {
  if (!value) return value;
  return value.split(UPSTREAM).join(`https://${PUBLIC_HOST}`);
}

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, UPSTREAM);

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.set("X-Forwarded-Host", incoming.host);
    headers.set("X-Forwarded-Proto", "https");
    const clientIP = request.headers.get("CF-Connecting-IP");
    if (clientIP) headers.set("X-Real-IP", clientIP);

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: METHODS_WITHOUT_BODY.has(request.method) ? undefined : request.body,
      redirect: "manual",
    });

    const out = new Headers(upstream.headers);
    out.set("location", rewriteUpstreamOrigin(out.get("location")));

    // 页面本身不缓存；/_next/static 下的资源由上游的缓存头决定
    if (!incoming.pathname.startsWith("/mintlify-assets/")) {
      out.set("Cache-Control", "no-store");
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: out,
    });
  },
};
