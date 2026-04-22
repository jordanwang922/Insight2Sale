import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** 在未安装 dotenv 时，从项目根目录 `.env` 注入尚未设置的变量（不覆盖已有环境变量）。 */
export function loadDotenvFromRoot() {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return;

  const lines = readFileSync(p, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) continue;
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}
