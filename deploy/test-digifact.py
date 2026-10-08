#!/usr/bin/env python3
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path


def read_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


settings = read_env(Path("/opt/proyecto-eve/.env"))
required = ["DIGIFACT_BASE_URL", "DIGIFACT_TAX_ID", "DIGIFACT_USERNAME", "DIGIFACT_PASSWORD"]
if any(not settings.get(key) for key in required):
    print("CONFIGURATION=incompleta")
    sys.exit(1)

tax_id = "".join(char for char in settings["DIGIFACT_TAX_ID"] if char.isalnum()).upper().rjust(12, "0")
username = settings["DIGIFACT_USERNAME"]
login = username if username.upper().startswith("GT.") else f"GT.{tax_id}.{username}"
payload = json.dumps({"Username": login, "Password": settings["DIGIFACT_PASSWORD"]}).encode()
url = settings["DIGIFACT_BASE_URL"].rstrip("/") + "/login/get_token"
request = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(request, timeout=30) as response:
        body = json.load(response)
        token = body.get("Token") or body.get("token")
        print(f"HTTP_STATUS={response.status}")
        print(f"ACCESS_TOKEN={'recibido' if token else 'faltante'}")
        sys.exit(0 if token else 1)
except urllib.error.HTTPError as error:
    print(f"HTTP_STATUS={error.code}")
    print("ERROR=Digifact rechazó la autenticación")
    sys.exit(1)
except Exception as error:
    print(f"ERROR_CONEXION={type(error).__name__}")
    sys.exit(1)
