# Make https://muzztech.com.au/ work

Mail is already on Proton (keep MX). Only change **web** records.

At your DNS panel for **muzztech.com.au** (nameserver.net.au):

## Delete
- Any **A** records pointing at Netlify (`75.2.60.5`, `99.83.231.61`, or similar)
- **www** CNAME → `glistening-faun-43ece2.netlify.app` (or any `*.netlify.app`)

## Add
| Host | Type | Value |
|------|------|--------|
| `@` or blank (apex) | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |
| `www` | CNAME | `muzz-ai963.github.io` |

## Do not touch
- **MX** → `mail.protonmail.ch` / `mailsec.protonmail.ch`
- Any Proton **TXT** (SPF/DKIM/verification)

Save → wait a few minutes → open https://muzztech.com.au/  
Then say **“check muzztech DNS”** and Cursor will verify HTTPS.
