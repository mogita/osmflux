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
