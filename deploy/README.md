# Deployment Notes

This directory records the host-specific deployment used for
`stoma.datummed.com`.

## Current Topology

- Public domain: `stoma.datummed.com`
- Reverse proxy: Nginx on ports `80` and `443`
- App runtime: systemd unit `stoma-website.service`
- App listen address: `127.0.0.1:3010`
- App directory: `/home/tonycao/mycode/stoma_website`
- Runtime env file: `/home/tonycao/mycode/stoma_website/.env`
- Production AI provider: `AI_PROVIDER_MODE=remote` with
  `AI_PROVIDER_BASE_URL=http://100.81.53.40:8000`

The port `3010` is intentionally duplicated in the Nginx config and the
systemd unit. Change both files together if the app port changes.

## Install Or Update

```bash
pnpm install
pnpm prisma:generate
pnpm build

sudo cp deploy/systemd/stoma-website.service /etc/systemd/system/stoma-website.service
sudo systemctl daemon-reload
sudo systemctl enable --now stoma-website

sudo cp deploy/nginx/stoma.datummed.com /etc/nginx/sites-available/stoma.datummed.com
sudo ln -sf /etc/nginx/sites-available/stoma.datummed.com /etc/nginx/sites-enabled/stoma.datummed.com
sudo nginx -t
sudo systemctl reload nginx

sudo cp deploy/letsencrypt/reload-nginx.sh /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo chmod 755 /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

Initial certificate issuance:

```bash
sudo mkdir -p /var/www/letsencrypt
sudo certbot certonly --webroot -w /var/www/letsencrypt -d stoma.datummed.com --agree-tos --non-interactive --register-unsafely-without-email
```

## Post-Deploy Checks

```bash
systemctl is-active stoma-website nginx
curl -I http://stoma.datummed.com
curl -I https://stoma.datummed.com
curl -sS https://stoma.datummed.com/api/auth/me
sudo certbot certificates
```
