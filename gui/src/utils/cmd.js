import { computer, filesystem, os } from '@neutralinojs/lib'
import path from './../utils/path'
import { getBasePath, unzip } from './fs'
import { sleep } from './sleep'
import axios from 'axios'

// getOSInfo returns standardized lower case os and arch names
// possible "os": linux, darwin, windows
// possible "arch": x64, arm64
export const getOSInfo = async () => {
  let arch = (await computer.getArch()).toLowerCase()
  if (arch === 'arm') {
    arch = 'arm64'
  }
  return {
    os: (NL_OS || 'unknown').toLowerCase(),
    arch,
  }
}

export const getLocalCommandDir = () => {
  if (!NL_PATH) {
    throw new Error('NL_PATH is not set')
  }
  return path.join(NL_PATH, 'commands')
}

export const getOsmosis = async () => {
  try {
    const channel = NL_RELEASE_INFO?.channel === 'dev' || import.meta.env.DEV === true ? 'dev' : 'stable'
    const url = `https://static.mogita.com/osmflux/releases/${channel}/latest/commands/osmosis.zip?ts=${+new Date()}`
    const resp = await axios.get(url, { responseType: 'arraybuffer' })

    const zipPath = path.join(getLocalCommandDir(), 'osmosis.zip')
    try {
      await filesystem.removeDirectory(zipPath)
    } catch (_) {}

    await filesystem.writeBinaryFile(zipPath, new Uint8Array(resp.data))
    const targetDir = path.join(getLocalCommandDir(), 'osmosis')
    await unzip(zipPath, targetDir)

    // fix executing permissions on unix
    if ((NL_OS || '').toLowerCase() !== 'windows') {
      await sleep(2000)
      await os.execCommand(`chmod +x "${targetDir}/bin/osmosis"`)
      await os.execCommand(`chmod +x "${targetDir}/bin/osmosis-extract-apidb-0.6"`)
      await os.execCommand(`chmod +x "${targetDir}/bin/osmosis-extract-mysql-0.6"`)
      await os.execCommand(`chmod +x "${targetDir}/script/contrib/dump_apidb.sh"`)
      await os.execCommand(`chmod +x "${targetDir}/script/contrib/replicate_osm_file.sh"`)
      await os.execCommand(`chmod +x "${targetDir}/script/fix_line_endings.sh"`)
      await os.execCommand(`chmod +x "${targetDir}/script/munin/osm_replication_lag"`)
    }
  } catch (err) {
    throw err
  }
}

export const getCommandPath = async (cmd = '') => {
  if (!NL_PATH) {
    throw new Error('NL_PATH is not set')
  }
  const info = await getOSInfo()
  if (cmd === 'osmosis') {
    return path.join(getLocalCommandDir(), 'osmosis', 'bin', info.os === 'windows' ? 'osmosis.bat' : 'osmosis')
  }
  // other commands
  if (import.meta.env.DEV === true) {
    // development environment
    return path.join(getLocalCommandDir(), cmd, info.os, info.arch, cmd)
  } else {
    // released environment
    return path.join(getLocalCommandDir(), cmd)
  }
}

export const checkJavaVM = async () => {
  try {
    const res = await os.execCommand('java -version')
    // NOTE: `java -version` might output to stdErr for the version info, although the exit code is 0.
    // So only exit code is tested here.
    if (res.exitCode > 0) {
      return false
    }
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}

export const getLocalCommandList = async () => {
  let list = []
  if (import.meta.env.DEV === true) {
    // it's a bit complicated for local dev from a released version, this function gathers the commands for current platform
    // and put them into a dev-only folder (will be created if not exists), then return the command list mimicking the
    // released version, so in the component there's no need to create different procedure for whether it's local dev or release
    const devDir = `${getBasePath()}/commands/dev-only`
    await os.execCommand(`rm -r "${devDir}"`)
    await os.execCommand(`mkdir -p "${devDir}"`)

    const info = await getOSInfo()
    const dirs = (await filesystem.readDirectory(`${getBasePath()}/commands`))
      .filter((e) => e.type === 'DIRECTORY' && !~['.', '..', 'dev-only', 'osmosis'].indexOf(e.entry))
      .map((e) => ({ dirPath: `${getBasePath()}/commands/${e.entry}`, cmd: e.entry }))

    for (const dir of dirs) {
      const srcPath = `${dir.dirPath}/${info.os}/${info.arch}/${dir.cmd}`
      const targetPath = `${getBasePath()}/commands/dev-only/${dir.cmd}`
      await filesystem.copyFile(srcPath, targetPath)
      list.push({ localPath: targetPath, cmd: dir.cmd, md5: '' })
    }
  } else {
    list = (await filesystem.readDirectory(`${getBasePath()}/commands`))
      .filter((e) => e.type === 'FILE')
      .map((e) => ({ localPath: `${getBasePath()}/commands/${e.entry}`, cmd: e.entry, md5: '' }))
  }
  const result = {}
  for (const res of list) {
    result[res.cmd] = { localPath: res.localPath, md5: res.md5, cmd: res.cmd }
  }
  return result
}
