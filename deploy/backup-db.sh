#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/opt/proyecto-eve
BACKUP_DIR="$APP_DIR/backups"
STAMP="$(date +%Y%m%d_%H%M%S)"
FILE_NAME="AZESHERBD_${STAMP}.bak"
CONTAINER_PATH="/var/opt/mssql/backups/${FILE_NAME}"

cd "$APP_DIR"
MSSQL_SA_PASSWORD="$(docker compose exec -T database printenv MSSQL_SA_PASSWORD | tr -d '\r')"

if [[ -z "$MSSQL_SA_PASSWORD" ]]; then
  printf 'No fue posible obtener la contraseña interna de SQL Server.\n' >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

docker compose exec -T \
  -e "SQLCMDPASSWORD=${MSSQL_SA_PASSWORD}" \
  database \
  /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -C -b \
  -Q "BACKUP DATABASE [AZESHERBD] TO DISK = N'${CONTAINER_PATH}' WITH INIT, CHECKSUM, STATS = 10; RESTORE VERIFYONLY FROM DISK = N'${CONTAINER_PATH}' WITH CHECKSUM;"

chown root:root "$BACKUP_DIR/$FILE_NAME"
chmod 600 "$BACKUP_DIR/$FILE_NAME"

# Retención local de catorce días. La copia externa se configura por separado.
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'AZESHERBD_20*.bak' -mtime +14 -delete

printf 'Respaldo verificado: %s\n' "$BACKUP_DIR/$FILE_NAME"
