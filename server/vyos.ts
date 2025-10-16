import { Client } from "ssh2";
import type { RouterApplyRequest, RouterApplyResponse } from "@shared/schema";

function execOverSsh(
  conn: Client,
  command: string,
  options?: { pty?: boolean }
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    conn.exec(command, { pty: options?.pty === true }, (err, stream) => {
      if (err) return reject(err);
      let stdout = "";
      let stderr = "";
      stream
        .on("close", (code: number | null) => {
          resolve({ stdout, stderr, code });
        })
        .on("data", (data: Buffer) => {
          stdout += data.toString();
        })
        .stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });
    });
  });
}

function buildVyOSScript(lines: string[], options: { commit: boolean; save: boolean; dryRun: boolean }): string {
  const safeLines = lines
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && (/^(set|delete)\s/.test(l)));

  const parts: string[] = [
    "source /opt/vyatta/etc/functions/script-template",
    "configure",
    ...safeLines,
  ];

  if (options.dryRun) {
    // Discard pending changes explicitly in non-interactive mode
    parts.push("discard");
  } else {
    if (options.commit) parts.push("commit");
    if (options.save) parts.push("save");
  }

  parts.push("exit");

  // Use '&&' to stop on first failure
  return parts.join(" && ");
}

async function runConfigureInteractive(
  conn: Client,
  setDeleteLines: string[],
  options: { commit: boolean; save: boolean; dryRun: boolean; timeoutMs?: number },
  log: (line: string) => void,
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 30000;
  const sentinelEnd = `__END_${Date.now()}__`;
  const sentinelCommit = `__COMMIT_${Date.now()}__`;
  const sentinelSave = `__SAVE_${Date.now()}__`;
  const sentinelCompare = `__COMPARE_${Date.now()}__`;

  await new Promise<void>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let done = false;
    const timer = setTimeout(() => {
      if (!done) reject(new Error('Interactive session timeout'));
    }, timeoutMs);
    (timer as any).unref?.();

    conn.shell({ pty: true }, (err, stream) => {
      if (err) {
        clearTimeout(timer);
        return reject(err);
      }

      const write = (cmd: string) => stream.write(cmd + "\n");
      stream.on('data', (d: Buffer) => {
        stdout += d.toString();
        // Heuristic logging truncation
        const lines = d.toString().split(/\r?\n/).filter(Boolean);
        lines.forEach((l) => log(l));
        if (stdout.includes(sentinelEnd)) {
          done = true;
          clearTimeout(timer);
          resolve();
        }
      });
      stream.stderr.on('data', (d: Buffer) => {
        stderr += d.toString();
        log(`[stderr] ${d.toString().trim()}`);
      });
      stream.on('close', () => {
        if (!done) {
          clearTimeout(timer);
          reject(new Error(stderr || 'SSH shell closed before completion'));
        }
      });

      // Start configure session
      write('configure');
      // Send set/delete lines
      for (const line of setDeleteLines) {
        write(line);
      }

      if (options.dryRun) {
        write('compare');
        write(`run echo ${sentinelCompare}`);
        write('discard');
        write(`run echo ${sentinelEnd}`);
        write('exit');
      } else {
        if (options.commit) {
          write('commit');
          write(`run echo ${sentinelCommit}`);
        }
        if (options.save) {
          write('save');
          write(`run echo ${sentinelSave}`);
        }
        write(`run echo ${sentinelEnd}`);
        write('exit');
      }
    });
  });
}

export async function applyVyOSConfig(request: RouterApplyRequest): Promise<RouterApplyResponse> {
  const { host, port = 22, username, password, privateKey, configuration, commit = true, save = true, dryRun = false } = request;

  const conn = new Client();
  const logs: string[] = [];

  function log(line: string) {
    logs.push(line);
  }

  await new Promise<void>((resolve, reject) => {
    conn
      .on("ready", () => resolve())
      .on("error", (err) => reject(err))
      // Support keyboard-interactive auth (common on VyOS)
      .on("keyboard-interactive", (_name: any, _instructions: any, _lang: any, prompts: any[], finish: (responses: string[]) => void) => {
        const responses = prompts.map(() => password || "");
        finish(responses);
      })
      .connect({ host, port, username, password, privateKey, readyTimeout: 15000, tryKeyboard: true });
  });

  try {
    const rawLines = configuration.split('\n');
    const setDeleteLines = rawLines
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && (/^(set|delete)\s/.test(l)));

    // Strategy 1: vyatta-cfg-cmd-wrapper (non-interactive, reliable on VyOS)
    async function runWrapper(cmd: string, timeoutMs = 20000) {
      const full = `/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper ${cmd}`;
      const { stdout, stderr, code } = await Promise.race([
        execOverSsh(conn, full, { pty: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${cmd}`)), timeoutMs)) as Promise<any>,
      ]);
      if (stdout) log(stdout.trim());
      if (stderr) log(stderr.trim());
      if (code && code !== 0) throw new Error(`${cmd} failed (${code}): ${stderr || stdout}`);
    }

    try {
      log('Applying via vyatta-cfg-cmd-wrapper (begin/session)');
      await runWrapper('begin');
      try {
        for (const line of setDeleteLines) {
          await runWrapper(line);
        }

        if (dryRun) {
          try {
            await runWrapper('compare');
          } finally {
            await runWrapper('discard');
          }
          return { applied: false, commit: false, saved: false, dryRun: true, logs };
        }

        if (commit) await runWrapper('commit', 30000);
        if (save) await runWrapper('save', 15000);

        return { applied: true, commit: !!commit, saved: !!save, dryRun: false, logs };
      } finally {
        try {
          await runWrapper('end');
        } catch (e) {
          log(`end failed: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      log(`Wrapper mode failed: ${(e as Error).message}; trying interactive configure`);
      await runConfigureInteractive(conn, setDeleteLines, { commit: !!commit, save: !!save, dryRun: !!dryRun, timeoutMs: 45000 }, log);
      return { applied: !dryRun, commit: !!commit && !dryRun, saved: !!save && !dryRun, dryRun: !!dryRun, logs };
    }
  } catch (primaryError) {
    log(`Wrapper mode failed: ${(primaryError as Error).message}`);
    // Strategy 2: vbash one-shot script as fallback
    try {
      const lines = configuration.split('\n');
      const script = buildVyOSScript(lines, { commit: !!commit, save: !!save, dryRun: !!dryRun });
      const command = `vbash -ic ${JSON.stringify(script)}`;
      log(`Fallback: executing script via vbash`);
      const { stdout, stderr, code } = await Promise.race([
        execOverSsh(conn, command, { pty: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SSH command timeout')), 30000)) as Promise<any>,
      ]);
      if (stdout) log(stdout.trim());
      if (stderr) log(stderr.trim());
      if (code && code !== 0) throw new Error(`Apply failed (${code}): ${stderr || stdout}`);
      return { applied: !dryRun, commit: !!commit && !dryRun, saved: !!save && !dryRun, dryRun: !!dryRun, logs };
    } catch (fallbackError) {
      log(`Fallback failed: ${(fallbackError as Error).message}`);
      throw fallbackError;
    }
  } finally {
    try { conn.end(); } catch {}
  }
}

export async function testSshCommand(params: { host: string; port?: number; username: string; password?: string; privateKey?: string; command?: string }): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const { host, port = 22, username, password, privateKey, command = 'show version' } = params;
  const conn = new Client();
  await new Promise<void>((resolve, reject) => {
    conn
      .on('ready', () => resolve())
      .on('error', (err) => reject(err))
      .on('keyboard-interactive', (_a,_b,_c,prompts,finish) => finish(prompts.map(() => password || '')))
      .connect({ host, port, username, password, privateKey, readyTimeout: 10000, tryKeyboard: true });
  });
  try {
    const { stdout, stderr, code } = await Promise.race([
      execOverSsh(conn, command, { pty: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SSH test timeout')), 8000)) as Promise<any>,
    ]);
    return { ok: !code, stdout, stderr };
  } finally {
    try { conn.end(); } catch {}
  }
}


