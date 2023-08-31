import { computer, filesystem, os } from '@neutralinojs/lib'
import path from './../utils/path'
import { getBasePath } from './fs'

// getOSInfo returns standardized lower case os and kernel names
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

export const getCommandPath = async (cmd = '') => {
  if (!NL_PATH) {
    throw new Error('NL_PATH is not set')
  }
  const info = await getOSInfo()
  if (import.meta.env.DEV === true) {
    return path.join(NL_PATH, 'commands', cmd, info.os, info.arch, cmd)
  } else {
    return path.join(NL_PATH, 'commands', cmd)
  }
}

export const getLocalCommandList = async () => {
  const list = []
  if (import.meta.env.DEV === true) {
    // it's a bit complicated for local dev from a released version, this function gathers the commands for current platform
    // and put them into a dev-only folder (will be created if not exists), then return the command list mimicking the
    // released version, so in the component there's no need to create different procedure for whether it's local dev or release
    const devDir = `${getBasePath()}/commands/dev-only`
    await os.execCommand(`rm -r ${devDir}`)
    await os.execCommand(`mkdir -p ${devDir}`)

    const info = await getOSInfo()
    const dirs = (await filesystem.readDirectory(`${getBasePath()}/commands`))
      .filter((e) => e.type === 'DIRECTORY' && !~['.', '..', 'dev-only'].indexOf(e.entry))
      .map((e) => ({ dirPath: `${getBasePath()}/commands/${e.entry}`, cmd: e.entry }))

    for (const dir of dirs) {
      const srcPath = `${dir.dirPath}/${info.os}/${info.arch}/${dir.cmd}`
      const targetPath = `${getBasePath()}/commands/dev-only/${dir.cmd}`
      console.log({ srcPath, targetPath })
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
