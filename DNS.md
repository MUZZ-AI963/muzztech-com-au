# Point muzztech.com.au at GitHub Pages

Until DNS moves, use: **https://muzz-ai963.github.io/muzztech-com-au/**

At your registrar (nameserver.net.au DNS):

1. Remove Netlify records (A → 75.2.60.5 / 99.83.231.61, and `www` CNAME → `*.netlify.app`).
2. Apex `muzztech.com.au` — four A records:
   - 185.199.108.153
   - 185.199.109.153
   - 185.199.110.153
   - 185.199.111.153
3. `www` — CNAME to `muzz-ai963.github.io`
4. Tell Cursor: **“add CNAME for muzztech.com.au”** — we put `CNAME` file back and turn on HTTPS in Pages.
5. Wait for DNS (often minutes, sometimes up to 48h). Hard refresh.

Mail (murray@muzztech.com.au) stays on your mail host — do not delete MX records.
