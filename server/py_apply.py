#!/usr/bin/env python3
import sys
import json
from typing import List

try:
  from netmiko import ConnectHandler
except Exception as e:
  print(json.dumps({"ok": False, "error": f"netmiko import failed: {e}"}))
  sys.exit(1)


def main():
  try:
    payload = json.load(sys.stdin)
  except Exception as e:
    print(json.dumps({"ok": False, "error": f"invalid json: {e}"}))
    return 1

  host = payload.get("host")
  port = int(payload.get("port") or 22)
  username = payload.get("username")
  password = payload.get("password")
  configuration = payload.get("configuration") or ""
  commit = bool(payload.get("commit", True))
  save = bool(payload.get("save", True))
  dry_run = bool(payload.get("dryRun", False))

  if not host or not username:
    print(json.dumps({"ok": False, "error": "host and username required"}))
    return 1

  logs: List[str] = []
  try:
    device = {
      'device_type': 'vyos',
      'host': host,
      'username': username,
      'password': password or '',
      'port': port,
      'fast_cli': False,
      'banner_timeout': 20,
      'auth_timeout': 20,
      'conn_timeout': 20,
      'session_log': None,
    }
    conn = ConnectHandler(**device)
  except Exception as e:
    print(json.dumps({"ok": False, "error": f"connect failed: {e}"}))
    return 1

  try:
    lines = [l.strip() for l in configuration.split('\n') if l.strip() and (l.strip().startswith('set ') or l.strip().startswith('delete '))]
    if not lines:
      print(json.dumps({"ok": False, "error": "no set/delete lines"}))
      return 1

    # Enter config mode and send commands
    conn.config_mode()
    out = conn.send_config_set(lines, exit_config_mode=False)
    if out:
      logs.append(out)

    if dry_run:
      cmp_out = conn.send_command('compare')
      if cmp_out:
        logs.append(cmp_out)
      conn.send_command('discard')
      conn.exit_config_mode()
      print(json.dumps({"ok": True, "applied": False, "commit": False, "saved": False, "dryRun": True, "logs": logs}))
      return 0

    if commit:
      cmt = conn.send_command('commit', expect_string=r'#')
      if cmt:
        logs.append(cmt)
    if save:
      sv = conn.send_command('save', expect_string=r'#')
      if sv:
        logs.append(sv)
    conn.exit_config_mode()

    print(json.dumps({"ok": True, "applied": True, "commit": bool(commit), "saved": bool(save), "dryRun": False, "logs": logs}))
    return 0
  except Exception as e:
    print(json.dumps({"ok": False, "error": f"apply failed: {e}", "logs": logs}))
    return 1
  finally:
    try:
      conn.disconnect()
    except Exception:
      pass


if __name__ == '__main__':
  sys.exit(main())


