// this script builds the binaries and make packages for deliveries to various platforms/architects
import { execa } from 'execa'
import fs from 'fs-extra'
import path from 'path'
import archiver from 'archiver'
import { rimrafSync } from 'rimraf'
import replaceInFile from 'replace-in-file'
import commands from './commands/meta.js'

const getPath = (...parts) => {
  return path.resolve(process.cwd(), ...parts)
}

const config = fs.readJsonSync(getPath('neutralino.config.json'))
const appName = config.cli.binaryName
const applicationId = config.applicationId
const appVersion = config.version

const fixIndexHtml = async () => {
  const options = {
    files: 'gui/index.html',
    from: /<script src="http:\/\/localhost:\d+\/__neutralino_globals\.js"><\/script>/,
    to: '<script src="/__neutralino_globals.js"></script>',
  }
  return replaceInFile(options)
}

const buildBaseApp = async () => {
  console.log(`[build] building ${appName}...`)
  const buildLogs = await execa('yarn', ['build'])
  console.log(buildLogs.stdout)
  console.error(buildLogs.stderr)

  // add executing permission, in case more binaries would be used add them in this list to automatically fix permission for them too
  // for now we only care about linux and darwin
  for (const binary of [
    `${appName}-linux_arm64`,
    `${appName}-linux_x64`,
    `${appName}-mac_arm64`,
    `${appName}-mac_x64`,
  ]) {
    fs.chmodSync(getPath('dist', appName, binary), 0o755)
  }
}

const buildLinuxPackage = async () => {
  console.log('[linux] building linux packages...')
  const binaryNameArm = `${appName}-linux_arm64`
  const binaryNameX64 = `${appName}-linux_x64`

  // remove old app package
  console.log('[linux] removing old packages...')
  rimrafSync(getPath('dist', 'packages', 'linux'))

  // create new app package structure
  console.log('[linux] creating package structures...')
  fs.mkdirpSync(getPath('dist', 'packages', 'linux', `${appName}-arm64`))
  fs.mkdirpSync(getPath('dist', 'packages', 'linux', `${appName}-arm64`, 'commands'))
  fs.mkdirpSync(getPath('dist', 'packages', 'linux', `${appName}-x64`))
  fs.mkdirpSync(getPath('dist', 'packages', 'linux', `${appName}-x64`, 'commands'))

  // copy the binary to app package
  console.log('[linux] copying binary and resources...')
  fs.copySync(
    getPath('dist', appName, binaryNameArm),
    getPath('dist', 'packages', 'linux', `${appName}-arm64`, appName),
  )
  fs.copySync(getPath('dist', appName, binaryNameX64), getPath('dist', 'packages', 'linux', `${appName}-x64`, appName))

  // copy resources.neu to app package
  fs.copySync(
    getPath('dist', appName, 'resources.neu'),
    getPath('dist', 'packages', 'linux', `${appName}-arm64`, 'resources.neu'),
  )
  fs.copySync(
    getPath('dist', appName, 'resources.neu'),
    getPath('dist', 'packages', 'linux', `${appName}-x64`, 'resources.neu'),
  )

  // copy commands into the app package
  for (const cmd in commands) {
    fs.copySync(
      getPath('commands', cmd, 'linux', 'arm64', cmd),
      getPath('dist', 'packages', 'linux', `${appName}-arm64`, 'commands', cmd),
    )
    fs.copySync(
      getPath('commands', cmd, 'linux', 'x64', cmd),
      getPath('dist', 'packages', 'linux', `${appName}-x64`, 'commands', cmd),
    )
  }

  console.log('[linux] packaging completed')
}

const buildWindowsPackage = async () => {
  console.log('[windows] building windows packages...')
  const binaryNameX64 = `${appName}-win_x64.exe`

  // remove old app package
  console.log('[windows] removing old packages...')
  rimrafSync(getPath('dist', 'packages', 'windows'))

  // create new app package structure
  fs.mkdirpSync(getPath('dist', 'packages', 'windows', `${appName}-x64`))
  fs.mkdirpSync(getPath('dist', 'packages', 'windows', `${appName}-x64`, 'commands'))

  // copy the binary to app package
  console.log('[windows] copying binary and resources...')
  fs.copySync(
    getPath('dist', appName, binaryNameX64),
    getPath('dist', 'packages', 'windows', `${appName}-x64`, `${appName}.exe`),
  )

  // copy resources.neu to app package
  fs.copySync(
    getPath('dist', appName, 'resources.neu'),
    getPath('dist', 'packages', 'windows', `${appName}-x64`, 'resources.neu'),
  )

  // copy commands into the app package
  for (const cmd in commands) {
    fs.copySync(
      getPath('commands', cmd, 'windows nt', 'x64', `${cmd}.exe`),
      getPath('dist', 'packages', 'windows', `${appName}-x64`, 'commands', `${cmd}.exe`),
    )
  }

  console.log('[windows] packaging completed')
}

const buildMacOSPackage = async () => {
  console.log('[darwin] building darwin packages...')

  const binaryNameArm = `${appName}-mac_arm64`
  const binaryNameX64 = `${appName}-mac_x64`
  const pkg = await fs.readJson(getPath('package.json'))

  // remove old app package
  console.log('[darwin] removing old packages...')
  rimrafSync(getPath('dist', 'packages', 'darwin'))

  // create new app package structure
  console.log('[darwin] creating package structures...')
  await fs.mkdirp(getPath('dist', 'packages', 'darwin', `${appName}-arm64.app`, 'Contents', 'MacOS'))
  await fs.mkdirp(getPath('dist', 'packages', 'darwin', `${appName}-arm64.app`, 'Contents', 'Resources'))
  await fs.mkdirp(getPath('dist', 'packages', 'darwin', `${appName}-arm64.app`, 'Contents', 'Resources', 'commands'))
  await fs.mkdirp(getPath('dist', 'packages', 'darwin', `${appName}-x64.app`, 'Contents', 'MacOS'))
  await fs.mkdirp(getPath('dist', 'packages', 'darwin', `${appName}-x64.app`, 'Contents', 'Resources'))
  await fs.mkdirp(getPath('dist', 'packages', 'darwin', `${appName}-x64.app`, 'Contents', 'Resources', 'commands'))

  // copy the binary to app package
  console.log('[darwin] copying binary and resources...')
  fs.copySync(
    getPath('dist', appName, binaryNameArm),
    getPath('dist', 'packages', 'darwin', `${appName}-arm64.app`, 'Contents', 'MacOS', appName),
  )
  fs.copySync(
    getPath('dist', appName, binaryNameX64),
    getPath('dist', 'packages', 'darwin', `${appName}-x64.app`, 'Contents', 'MacOS', appName),
  )

  // copy resources.neu to app package
  fs.copySync(
    getPath('dist', appName, 'resources.neu'),
    getPath('dist', 'packages', 'darwin', `${appName}-arm64.app`, 'Contents', 'Resources', 'resources.neu'),
  )
  fs.copySync(
    getPath('dist', appName, 'resources.neu'),
    getPath('dist', 'packages', 'darwin', `${appName}-x64.app`, 'Contents', 'Resources', 'resources.neu'),
  )

  // copy commands into the app package
  for (const cmd in commands) {
    fs.copySync(
      getPath('commands', cmd, 'darwin', 'arm64', cmd),
      getPath('dist', 'packages', 'darwin', `${appName}-arm64.app`, 'Contents', 'Resources', 'commands', cmd),
    )
    fs.copySync(
      getPath('commands', cmd, 'darwin', 'x64', cmd),
      getPath('dist', 'packages', 'darwin', `${appName}-x64.app`, 'Contents', 'Resources', 'commands', cmd),
    )
  }

  console.log('[darwin] copying the icon...')
  fs.copySync(
    getPath('gui', 'public', 'osmflux.icns'),
    getPath('dist', 'packages', 'darwin', `${appName}-arm64.app`, 'Contents', 'Resources', 'AppIcon.icns'),
  )
  fs.copySync(
    getPath('gui', 'public', 'osmflux.icns'),
    getPath('dist', 'packages', 'darwin', `${appName}-x64.app`, 'Contents', 'Resources', 'AppIcon.icns'),
  )

  // add starting script
  console.log('[darwin] creating startup script...')
  const startupScript = `#!/usr/bin/env bash
SCRIPT_DIR="$( cd -- "$( dirname -- "\${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
CONTENTS_DIR="$(dirname "$SCRIPT_DIR")"
exec "\${SCRIPT_DIR}/${appName}" --path="\${CONTENTS_DIR}/Resources"`
  fs.writeFileSync(
    getPath('dist', 'packages', 'darwin', `${appName}-arm64.app`, 'Contents', 'MacOS', 'parameterized'),
    startupScript,
  )
  fs.writeFileSync(
    getPath('dist', 'packages', 'darwin', `${appName}-x64.app`, 'Contents', 'MacOS', 'parameterized'),
    startupScript,
  )

  // make sure executing permissions
  fs.chmodSync(
    getPath('dist', 'packages', 'darwin', `${appName}-arm64.app`, 'Contents', 'MacOS', 'parameterized'),
    0o755,
  )
  fs.chmodSync(getPath('dist', 'packages', 'darwin', `${appName}-arm64.app`, 'Contents', 'MacOS', appName), 0o755)
  fs.chmodSync(getPath('dist', 'packages', 'darwin', `${appName}-x64.app`, 'Contents', 'MacOS', 'parameterized'), 0o755)
  fs.chmodSync(getPath('dist', 'packages', 'darwin', `${appName}-x64.app`, 'Contents', 'MacOS', appName), 0o755)

  // create info.plist file
  console.log('[darwin] creating info.plist...')
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
        <key>NSHighResolutionCapable</key>
        <true/>
        <key>CFBundleExecutable</key>
        <string>parameterized</string>
        <key>CFBundleGetInfoString</key>
        <string>${pkg.name}</string>
        <key>CFBundleIconFile</key>
        <string>AppIcon.icns</string>
        <key>CFBundleIdentifier</key>
        <string>${config.applicationId}</string>
        <key>CFBundleName</key>
        <string>${pkg.name}</string>
        <key>CFBundlePackageType</key>
        <string>APPL</string>
        <key>LSMinimumSystemVersion</key>
        <string>10.13.0</string>
        <key>NSAppTransportSecurity</key>
        <dict>
            <key>NSAllowsArbitraryLoads</key>
            <true/>
        </dict>
    </dict>
    </plist>`
  fs.writeFileSync(getPath('dist', 'packages', 'darwin', `${appName}-arm64.app`, 'Contents', 'info.plist'), infoPlist)
  fs.writeFileSync(getPath('dist', 'packages', 'darwin', `${appName}-x64.app`, 'Contents', 'info.plist'), infoPlist)

  console.log('[darwin] packaging completed')
}

const createZipArchives = async () => {
  console.log(`[archives] creating zipped archives...`)
  rimrafSync(getPath('dist', 'archives'))
  fs.mkdirpSync(getPath('dist', 'archives'))

  const targets = [
    ['darwin', 'x64.app', `${appName}.app`],
    ['darwin', 'arm64.app', `${appName}.app`],
    ['linux', 'x64', false],
    ['linux', 'arm64', false],
    ['windows', 'x64', false],
  ]

  for (const [platform, architecture, destPath] of targets) {
    console.log(`[archives] archiving target ${platform}-${architecture}...`)
    const output = fs.createWriteStream(getPath('dist', 'archives', `${appName}-${platform}-${architecture}.zip`))
    const archive = archiver('zip')
    output.on('close', () =>
      console.log(`[archives] target ${platform}-${architecture} has written ${archive.pointer()} bytes in total`),
    )
    archive.on('error', (err) => {
      throw err
    })
    archive.pipe(output)
    archive.directory(getPath('dist', 'packages', platform, `${appName}-${architecture}`), destPath)
    await archive.finalize()
  }

  console.log(`[archives] archiving completed`)
}

const generateUpdateManifest = async () => {
  const manifest = {
    applicationId: applicationId,
    version: appVersion,
    resourcesURL: 'https://static.mogita.com/osmflux/releases/stable/latest/resources.neu',
    data: {},
  }

  fs.writeFileSync(getPath('dist', 'update_manifest.json'), JSON.stringify(manifest))
}

const catchAndExit = (err) => {
  console.error(err)
  process.exit(1)
}

fixIndexHtml()
  .then(buildBaseApp)
  .then(buildLinuxPackage)
  .then(buildMacOSPackage)
  .then(buildWindowsPackage)
  .then(createZipArchives)
  .then(generateUpdateManifest)
  .catch(catchAndExit)
