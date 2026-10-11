
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { builtinModules } = require("module");

const root = process.cwd();
const packageJsonPath = path.join(root, "package.json");

if (!fs.existsSync(packageJsonPath)) {
  console.error("Run this script from your Expo project root.");
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const declared = new Set([
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {}),
  ...Object.keys(packageJson.optionalDependencies || {}),
]);

const ignoredDirs = new Set([
  "node_modules", ".git", ".expo", "dist", "build",
  "backend", "android", "ios", ".next", "coverage",
]);

const extensions = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
]);

const imports = new Set();
const builtins = new Set(
  builtinModules.flatMap((name) => [name, `node:${name}`])
);

function scan(dir) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) scan(fullPath);
      continue;
    }

    if (!extensions.has(path.extname(entry.name))) continue;

    const source = fs.readFileSync(fullPath, "utf8");

    const patterns = [
      /\bfrom\s*["']([^"']+)["']/g,
      /\bimport\s*["']([^"']+)["']/g,
      /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
      /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
    ];

    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) {
        const specifier = match[1];

        // Ignore relative paths, aliases, URLs and Node built-ins.
        if (
          specifier.startsWith(".") ||
          specifier.startsWith("@/") ||
          specifier.startsWith("~/") ||
          specifier.startsWith("#") ||
          specifier.startsWith("/") ||
          specifier.includes("://") ||
          builtins.has(specifier)
        ) continue;

        const parts = specifier.split("/");
        const name = specifier.startsWith("@")
          ? parts.slice(0, 2).join("/")
          : parts[0];

        imports.add(name);
      }
    }
  }
}

// Scan frontend code and root configuration files, excluding backend.
for (const dir of [
  "app", "src", "components", "services", "hooks",
  "contexts", "utils", "constants", "assets",
]) {
  scan(path.join(root, dir));
}


const missing = [...imports]
  .filter((name) => !declared.has(name))
  .sort();

if (missing.length === 0) {
  console.log("No missing direct dependencies found in scanned source.");
  console.log("Running npm install to restore declared dependencies...");
  process.exit(
    spawnSync("npm", ["install"], { stdio: "inherit", shell: true }).status ?? 1
  );
}

console.log("Missing frontend dependencies:");
console.log(missing.map((name) => `  - ${name}`).join("\n"));

const expoPackages = missing.filter((name) =>
  name.startsWith("expo-") ||
  name.startsWith("@expo/") ||
  name.startsWith("react-native-") ||
  name.startsWith("@react-native-community/") ||
  name.startsWith("@react-native-async-storage/") ||
  name.startsWith("@react-native-picker/")
);

const npmPackages = missing.filter(
  (name) => !expoPackages.includes(name)
);

function install(command, args) {
  if (!args.length) return true;

  console.log(`\nRunning: ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  return result.status === 0;
}

const expoCli = process.platform === "win32" ? "npx.cmd" : "npx";
const npmCli = process.platform === "win32" ? "npm.cmd" : "npm";

if (!install(expoCli, ["expo", "install", ...expoPackages])) {
  console.error("\nExpo package installation failed. Fix the error above.");
  process.exit(1);
}

if (!install(npmCli, ["install", ...npmPackages])) {
  console.error("\nNPM package installation failed. Fix the error above.");
  process.exit(1);
}

console.log("\nDependency installation completed.");
console.log("Review the output above for any failed installations.");
