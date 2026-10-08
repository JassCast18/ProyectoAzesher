#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=/opt/proyecto-eve
ENV_FILE="$APP_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  printf 'No existe %s.\n' "$ENV_FILE" >&2
  exit 1
fi

read -r -p 'Usuario TEST de Digifact [TESTUSER]: ' digifact_username
digifact_username="${digifact_username:-TESTUSER}"
read -r -s -p 'Contraseña TEST de Digifact (no se mostrará): ' digifact_password
printf '\n'

if [[ -z "$digifact_password" ]]; then
  printf 'La contraseña de Digifact es obligatoria.\n' >&2
  exit 1
fi

umask 077
tmp_file="$(mktemp "$APP_DIR/.env.digifact.XXXXXX")"
trap 'rm -f "$tmp_file"' EXIT

found_enabled=false
found_environment=false
found_url=false
found_tax_id=false
found_username=false
found_password=false

while IFS= read -r line || [[ -n "$line" ]]; do
  key="${line%%=*}"
  case "$key" in
    DIGIFACT_ENABLED) printf 'DIGIFACT_ENABLED=true\n' >> "$tmp_file"; found_enabled=true ;;
    DIGIFACT_ENVIRONMENT) printf 'DIGIFACT_ENVIRONMENT=Test\n' >> "$tmp_file"; found_environment=true ;;
    DIGIFACT_BASE_URL) printf 'DIGIFACT_BASE_URL=https://testnucgt.digifact.com/api/\n' >> "$tmp_file"; found_url=true ;;
    DIGIFACT_TAX_ID) printf 'DIGIFACT_TAX_ID=70361894\n' >> "$tmp_file"; found_tax_id=true ;;
    DIGIFACT_USERNAME) printf 'DIGIFACT_USERNAME=%s\n' "$digifact_username" >> "$tmp_file"; found_username=true ;;
    DIGIFACT_PASSWORD) printf 'DIGIFACT_PASSWORD=%s\n' "$digifact_password" >> "$tmp_file"; found_password=true ;;
    *) printf '%s\n' "$line" >> "$tmp_file" ;;
  esac
done < "$ENV_FILE"

$found_enabled || printf 'DIGIFACT_ENABLED=true\n' >> "$tmp_file"
$found_environment || printf 'DIGIFACT_ENVIRONMENT=Test\n' >> "$tmp_file"
$found_url || printf 'DIGIFACT_BASE_URL=https://testnucgt.digifact.com/api/\n' >> "$tmp_file"
$found_tax_id || printf 'DIGIFACT_TAX_ID=70361894\n' >> "$tmp_file"
$found_username || printf 'DIGIFACT_USERNAME=%s\n' "$digifact_username" >> "$tmp_file"
$found_password || printf 'DIGIFACT_PASSWORD=%s\n' "$digifact_password" >> "$tmp_file"

chown root:root "$tmp_file"
chmod 600 "$tmp_file"
mv "$tmp_file" "$ENV_FILE"
trap - EXIT
unset digifact_password

cd "$APP_DIR"
docker compose up -d --force-recreate api
printf 'Digifact TEST quedó habilitado. Las credenciales no fueron mostradas ni guardadas en Git.\n'
