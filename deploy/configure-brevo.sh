#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=/opt/proyecto-eve
ENV_FILE="$APP_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  printf 'No existe %s.\n' "$ENV_FILE" >&2
  exit 1
fi

read -r -p 'SMTP login mostrado por Brevo: ' smtp_username
read -r -s -p 'Clave SMTP de Brevo (no se mostrará): ' smtp_password
printf '\n'

if [[ -z "$smtp_username" || -z "$smtp_password" ]]; then
  printf 'El login y la clave SMTP son obligatorios.\n' >&2
  exit 1
fi

umask 077
tmp_file="$(mktemp "$APP_DIR/.env.brevo.XXXXXX")"
trap 'rm -f "$tmp_file"' EXIT

found_enabled=false
found_host=false
found_port=false
found_ssl=false
found_from=false
found_name=false
found_username=false
found_password=false

while IFS= read -r line || [[ -n "$line" ]]; do
  key="${line%%=*}"
  case "$key" in
    SMTP_ENABLED) printf 'SMTP_ENABLED=true\n' >> "$tmp_file"; found_enabled=true ;;
    SMTP_HOST) printf 'SMTP_HOST=smtp-relay.brevo.com\n' >> "$tmp_file"; found_host=true ;;
    SMTP_PORT) printf 'SMTP_PORT=587\n' >> "$tmp_file"; found_port=true ;;
    SMTP_ENABLE_SSL) printf 'SMTP_ENABLE_SSL=true\n' >> "$tmp_file"; found_ssl=true ;;
    SMTP_FROM) printf 'SMTP_FROM=no-responder@azesher.com\n' >> "$tmp_file"; found_from=true ;;
    SMTP_FROM_NAME) printf 'SMTP_FROM_NAME=Aze-Sher\n' >> "$tmp_file"; found_name=true ;;
    SMTP_USERNAME) printf 'SMTP_USERNAME=%s\n' "$smtp_username" >> "$tmp_file"; found_username=true ;;
    SMTP_PASSWORD) printf 'SMTP_PASSWORD=%s\n' "$smtp_password" >> "$tmp_file"; found_password=true ;;
    *) printf '%s\n' "$line" >> "$tmp_file" ;;
  esac
done < "$ENV_FILE"

$found_enabled || printf 'SMTP_ENABLED=true\n' >> "$tmp_file"
$found_host || printf 'SMTP_HOST=smtp-relay.brevo.com\n' >> "$tmp_file"
$found_port || printf 'SMTP_PORT=587\n' >> "$tmp_file"
$found_ssl || printf 'SMTP_ENABLE_SSL=true\n' >> "$tmp_file"
$found_from || printf 'SMTP_FROM=no-responder@azesher.com\n' >> "$tmp_file"
$found_name || printf 'SMTP_FROM_NAME=Aze-Sher\n' >> "$tmp_file"
$found_username || printf 'SMTP_USERNAME=%s\n' "$smtp_username" >> "$tmp_file"
$found_password || printf 'SMTP_PASSWORD=%s\n' "$smtp_password" >> "$tmp_file"

chown root:root "$tmp_file"
chmod 600 "$tmp_file"
mv "$tmp_file" "$ENV_FILE"
trap - EXIT
unset smtp_password

cd "$APP_DIR"
docker compose up -d --force-recreate api
printf 'Brevo quedó habilitado. La clave no fue mostrada ni guardada en Git.\n'
