const { spawn } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

function parseVersion(version) {
  const [major = '0', minor = '0', patch = '0'] = version.replace(/^v/, '').split('.')
  return {
    major: Number.parseInt(major, 10) || 0,
    minor: Number.parseInt(minor, 10) || 0,
    patch: Number.parseInt(patch, 10) || 0,
  }
}

function isCompatible(version) {
  const parsed = parseVersion(version)

  if (parsed.major > 20) return true
  if (parsed.major < 20) return false
  return parsed.minor >= 9
}

function collectCandidateNodes() {
  const candidates = []
  const envNode = process.env.COPILOT_REVIEW_HUB_NODE20

  if (envNode) {
    candidates.push(envNode)
  }

  const nvmRoot = path.join(os.homedir(), '.nvm', 'versions', 'node')
  if (fs.existsSync(nvmRoot)) {
    for (const entry of fs.readdirSync(nvmRoot)) {
      candidates.push(path.join(nvmRoot, entry, 'bin', 'node'))
    }
  }

  candidates.push('/usr/local/bin/node')
  candidates.push('/opt/homebrew/bin/node')

  return [...new Set(candidates)].filter(candidate => fs.existsSync(candidate))
}

function resolveCompatibleNode() {
  // Prefer the current runtime, but fall back to any local Node 20 install so CI-less environments can still build.
  for (const candidate of collectCandidateNodes()) {
    try {
      const version = spawnSyncSafe(candidate, ['-v']).trim()
      if (isCompatible(version)) {
        return candidate
      }
    } catch {
      // Ignore invalid runtimes and continue scanning.
    }
  }

  return null
}

function spawnSyncSafe(command, args) {
  const result = require('node:child_process').spawnSync(command, args, {
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Failed to run ${command}`)
  }

  return result.stdout
}

const selectedNode = isCompatible(process.version) ? process.execPath : resolveCompatibleNode()

if (!selectedNode) {
  console.error('Build requires Node.js >=20.9.0. Install Node 20 or set COPILOT_REVIEW_HUB_NODE20 to a compatible node binary.')
  process.exit(1)
}

const selectedBinDir = path.dirname(selectedNode)
const env = {
  ...process.env,
  // Ensure spawned next/tsc commands resolve against the compatible Node binary we selected above.
  PATH: `${selectedBinDir}${path.delimiter}${process.env.PATH || ''}`,
}

const child = spawn('next', ['build'], {
  stdio: 'inherit',
  shell: true,
  env,
})

child.on('exit', (nextCode) => {
  if (nextCode !== 0) {
    process.exit(nextCode ?? 1)
    return
  }

  const tsc = spawn('tsc', ['-p', 'tsconfig.server.json'], {
    stdio: 'inherit',
    shell: true,
    env,
  })

  tsc.on('exit', (tscCode) => {
    process.exit(tscCode ?? 1)
  })
})