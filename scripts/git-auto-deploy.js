#!/usr/bin/env node
const fs = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const LOG_DIR = path.join(REPO_ROOT, "logs");
const LOG_FILE = path.join(LOG_DIR, "deploy.log");
const LOCK_FILE = "/tmp/bloodscript-deploy.lock";
const POLL_INTERVAL_MS = 5000;

const PM2_PROCESS_NAME = "blood-script-engine";
const CLIENT_BUCKET = "gs://bloodscriptengine-companion";
const WEBSITE_BUCKET = "gs://bloodscriptengine-www";

async function ensureLogDir() {
  await fs.mkdir(LOG_DIR, { recursive: true });
}

function timestamp() {
  return new Date().toISOString();
}

async function log(message) {
  const line = `[${timestamp()}] ${message}\n`;
  await fs.appendFile(LOG_FILE, line);
  process.stdout.write(line);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const error = new Error(
          `Command failed: ${command} ${args.join(" ")} (exit ${code})`
        );
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      }
    });
  });
}

async function acquireLock() {
  try {
    const handle = await fs.open(LOCK_FILE, "wx");
    await handle.writeFile(`${process.pid}\n`);
    await handle.close();
    return true;
  } catch (error) {
    if (error.code === "EEXIST") {
      return false;
    }
    throw error;
  }
}

async function releaseLock() {
  try {
    await fs.unlink(LOCK_FILE);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

function classifyChanges(files) {
  let backend = false;
  let client = false;
  let website = false;
  let shared = false;

  for (const file of files) {
    if (file.startsWith("src/") || file.startsWith("db/")) {
      backend = true;
    } else if (file.startsWith("client/")) {
      client = true;
    } else if (file.startsWith("website/")) {
      website = true;
    } else if (file.trim() !== "") {
      shared = true;
    }
  }

  if (shared) {
    backend = true;
    client = true;
    website = true;
  }

  return { backend, client, website };
}

async function gitFetch() {
  await runCommand("git", ["fetch", "--all", "--prune"]);
}

async function gitHead() {
  const { stdout } = await runCommand("git", ["rev-parse", "HEAD"]);
  return stdout.trim();
}

async function gitUpstream() {
  const { stdout } = await runCommand("git", ["rev-parse", "@{u}"]);
  return stdout.trim();
}

async function gitDiffFiles() {
  const { stdout } = await runCommand("git", ["diff", "--name-only", "HEAD..@{u}"]);
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

async function gitPull() {
  await runCommand("git", ["pull", "--ff-only"]);
}

async function buildBackend() {
  await log("Backend: npm install");
  await runCommand("npm", ["install"], { cwd: REPO_ROOT });
  await log("Backend: npm run build");
  await runCommand("npm", ["run", "build"], { cwd: REPO_ROOT });
}

async function restartBackend() {
  await log(`Backend: pm2 restart ${PM2_PROCESS_NAME}`);
  await runCommand("pm2", ["restart", PM2_PROCESS_NAME], { cwd: REPO_ROOT });
}

async function buildClient() {
  const clientDir = path.join(REPO_ROOT, "client");
  await log("Client: npm install");
  await runCommand("npm", ["install"], { cwd: clientDir });
  await log("Client: npm run build");
  await runCommand("npm", ["run", "build"], { cwd: clientDir });
}

async function deployClient() {
  const clientDir = path.join(REPO_ROOT, "client");
  await log(`Client: deploy to ${CLIENT_BUCKET}`);
  await runCommand("gsutil", ["-m", "rsync", "-R", "-d", "dist", CLIENT_BUCKET], {
    cwd: clientDir,
  });
}

async function buildWebsite() {
  const websiteDir = path.join(REPO_ROOT, "website");
  await log("Website: npm install");
  await runCommand("npm", ["install"], { cwd: websiteDir });
  await log("Website: npm run build");
  await runCommand("npm", ["run", "build"], { cwd: websiteDir });
}

async function deployWebsite() {
  const websiteDir = path.join(REPO_ROOT, "website");
  await log(`Website: deploy to ${WEBSITE_BUCKET}`);
  await runCommand("gsutil", ["-m", "rsync", "-R", "-d", "dist", WEBSITE_BUCKET], {
    cwd: websiteDir,
  });
}

async function performDeploy() {
  await log("Checking for updates...");
  await gitFetch();

  const head = await gitHead();
  const upstream = await gitUpstream();

  if (head === upstream) {
    await log("No updates detected.");
    return;
  }

  const changedFiles = await gitDiffFiles();
  const targets = classifyChanges(changedFiles);

  await log(`Updates detected. Files changed: ${changedFiles.join(", ") || "none"}`);
  await log(
    `Targets: backend=${targets.backend}, client=${targets.client}, website=${targets.website}`
  );

  await log("Pulling latest changes...");
  await gitPull();

  const buildSteps = [];
  if (targets.backend) {
    buildSteps.push(buildBackend);
  }
  if (targets.client) {
    buildSteps.push(buildClient);
  }
  if (targets.website) {
    buildSteps.push(buildWebsite);
  }

  for (const step of buildSteps) {
    await step();
  }

  if (targets.client) {
    await deployClient();
  }
  if (targets.website) {
    await deployWebsite();
  }
  if (targets.backend) {
    await restartBackend();
  }

  await log("Deployment completed successfully.");
}

async function poll() {
  await ensureLogDir();

  let inProcess = false;
  setInterval(async () => {
    if (inProcess) {
      return;
    }
    inProcess = true;
    try {
      const acquired = await acquireLock();
      if (!acquired) {
        await log("Deployment already running. Skipping this cycle.");
        return;
      }
      try {
        await performDeploy();
      } finally {
        await releaseLock();
      }
    } catch (error) {
      await log(`Deployment error: ${error.message}`);
      if (error.stderr) {
        await log(`stderr: ${error.stderr.trim()}`);
      }
    } finally {
      inProcess = false;
    }
  }, POLL_INTERVAL_MS);
}

poll().catch(async (error) => {
  await log(`Fatal error: ${error.message}`);
  process.exitCode = 1;
});
