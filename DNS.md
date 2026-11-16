# Make https://muzztech.com.au/ work (VentraIP)

DNS is at **VentraIP** (`nameserver.net.au`). Mail is **Proton** — keep MX/TXT.

GitHub Pages is ready. The domain works only after you change the **web** records below.

## 1 · In VentraIP DNS for muzztech.com.au

**Delete**
- A records → `75.2.60.5` / `99.83.231.61` (Netlify)
- www CNAME → `glistening-faun-43ece2.netlify.app`

**Add**
| Host | Type | Value |
|------|------|--------|
| @ | A | 185.199.108.153 |
| @ | A | 185.199.109.153 |
| @ | A | 185.199.110.153 |
| @ | A | 185.199.111.153 |
| www | CNAME | muzz-ai963.github.io |

**Leave alone:** MX to Proton, SPF/DKIM/DMARC TXT.

## 2 · Tell Cursor

Say: **check muzztech DNS**  
Cursor will put the `CNAME` file back, turn on HTTPS, and confirm https://muzztech.com.au/ loads the site.

Until then use: https://muzz-ai963.github.io/muzztech-com-au/
