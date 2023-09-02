import { filesystem } from '@neutralinojs/lib'
import md5 from 'md5'

export const dirname = (filepath) => {
  if (filepath.indexOf('/') == -1) {
    // windows
    return filepath.substring(0, filepath.lastIndexOf('\\'))
  } else {
    // unix
    return filepath.substring(0, filepath.lastIndexOf('/'))
  }
}

export const getLastOpenedDir = () => {
  return localStorage.getItem('osmflux_last_opened_dir') || '/'
}

export const setLastOpenedDir = (dirpath) => {
  localStorage.setItem('osmflux_last_opened_dir', dirpath)
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
    console.error(err)
    throw err
  }
}
