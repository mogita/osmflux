import { computer, filesystem } from '@neutralinojs/lib'
import path from './../utils/path'

const kernel = (NL_OS || 'unknown').toLowerCase()
let arch = 'unknown'
const updateArch = async () => {
  arch = ((await computer.getArch()) || 'unknown').toLowerCase()
}

export const getCommandPath = async (cmd = '') => {
  if (!NL_PATH) {
    throw new Error('NL_PATH is not set')
  }
  await updateArch()
  if (import.meta.env.DEV === true) {
    return path.join(NL_PATH, 'commands', cmd, kernel, arch === 'arm' ? 'arm64' : arch, cmd)
  } else {
    return path.join(NL_PATH, 'commands', cmd)
  }
}
