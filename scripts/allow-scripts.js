#!/usr/bin/env node

// Run allow-scripts for the root package and every workspace. The Yarn plugin
// invokes `yarn run allow-scripts` once, from the repository root.
const { spawnSync } = require('node:child_process')
const { existsSync, readdirSync } = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const cli = path.join(
  root,
  'node_modules/@lavamoat/allow-scripts/src/cli.js',
)

const directories = [root]
const packagesDirectory = path.join(root, 'packages')
for (const name of readdirSync(packagesDirectory)) {
  const directory = path.join(packagesDirectory, name)
  if (existsSync(path.join(directory, 'package.json'))) {
    directories.push(directory)
  }
}

let status = 0
for (const directory of directories) {
  const result = spawnSync(process.execPath, [cli, 'run'], {
    cwd: directory,
    stdio: 'inherit',
  })
  if (result.status) {
    status = result.status
  }
}

process.exit(status)
