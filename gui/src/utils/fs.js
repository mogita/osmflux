import { filesystem, storage, os } from '@neutralinojs/lib'
import md5 from 'md5'

const getSafeDir = async (key, safe) => {
  let safeDir = safe
  if (!safeDir) {
    try {
      safeDir = await os.getPath('documents')
    } catch (err) {
      console.error(err)
      safeDir = NL_OS?.toLowerCase() === 'windows' ? 'C:\\' : '/'
    }
  }
  try {
    const customDir = await storage.getData(key)
    await filesystem.getStats(customDir)
    safeDir = customDir
  } catch (_) {}
  return safeDir
}

export const getLastOpenedDir = async () => {
  return getSafeDir('osmflux_last_opened_dir')
}

export const setLastOpenedDir = async (dirpath) => {
  return storage.setData('osmflux_last_opened_dir', dirpath)
}

export const getLastSavedDir = async () => {
  return getSafeDir('osmflux_last_saved_dir')
}

export const setLastSavedDir = async (dirpath) => {
  return storage.setData('osmflux_last_saved_dir', dirpath)
}

// getBasePath returns the current base path as an absolute path, i.e. the directory containing the osmflux executable
export const getBasePath = () => {
  return import.meta.env.PROD === true ? NL_PATH : NL_CWD
}

export const getFileMD5 = async (filepath) => {
  try {
    const data = await filesystem.readBinaryFile(filepath)
    return md5(new Uint8Array(data))
  } catch (err) {
    throw err
  }
}
