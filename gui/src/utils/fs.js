import { filesystem, storage, os } from '@neutralinojs/lib'
import JSZip from 'jszip'
import md5 from 'md5'
import path from './path'
import { getLocalCommandDir } from './cmd'

const getSafeDir = async (key, safe) => {
  let safeDir = safe
  if (!safeDir) {
    try {
      safeDir = await os.getPath('documents')
    } catch (err) {
      console.error(err)
      safeDir = (NL_OS || '').toLowerCase() === 'windows' ? 'C:\\' : '/'
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

export const mkdirP = async (dirpath) => {
  try {
    if ((NL_OS || '').toLowerCase() === 'windows') {
      return os.execCommand(`mkdir ${dirpath}`)
    } else {
      return os.execCommand(`mkdir -p ${dirpath}`)
    }
  } catch (err) {
    throw err
  }
}

export const getFileMD5 = async (filepath) => {
  try {
    const data = await filesystem.readBinaryFile(filepath)
    return md5(new Uint8Array(data))
  } catch (err) {
    throw err
  }
}

export const unzip = async (zipfile, targetDir) => {
  try {
    const zip = new JSZip()
    const data = await filesystem.readBinaryFile(zipfile)
    const files = await zip.loadAsync(new Uint8Array(data))

    await mkdirP(targetDir)

    let error = null

    files.forEach(async (relPath, file) => {
      if (error) {
        return
      }
      try {
        const fullpath = path.join(targetDir, relPath)
        const info = path.parse(fullpath)
        await mkdirP(info.dir)
        if (!info.isDir) {
          const content = await file.async('uint8array')
          await filesystem.writeBinaryFile(fullpath, content)
        }
      } catch (err) {
        error = err
      }
    })

    if (error) {
      throw err
    }
  } catch (err) {
    // throw err
    console.error(err)
  }
}

// unzip(path.join(NL_PATH, 'commands', 'osmosis.zip'), path.join(NL_PATH, 'commands', 'osmosis-test'))
