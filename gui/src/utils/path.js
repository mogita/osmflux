export const join = (...parts) => {
  let sep = '/'
  if (NL_OS?.toLowerCase() === 'windows') {
    sep = '\\'
  }
  var replace = new RegExp(sep + '{1,}', 'g')
  return parts.join(sep).replace(replace, sep)
}

export const dirname = (filepath) => {
  const { dir } = parse(filepath)
  return dir
}

export const parse = (filepath) => {
  let sep = '/'
  const winSep = `\\`
  if (filepath.includes(winSep)) {
    sep = winSep
  }

  if (filepath === sep) {
    return {
      basename: sep,
      dir: sep,
      isDir: true,
      filename: sep,
      ext: '',
    }
  }

  const consecutive = `${sep}{2,}`
  const reg = new RegExp(consecutive, 'g')
  filepath = filepath.replace(reg, sep)

  let isDir = false
  if (filepath[filepath.length - 1] === sep) {
    isDir = true
    filepath = filepath.substring(0, filepath.length - 1)
  }

  const split = filepath.split(sep)
  const basename = split.pop()
  const dir = split.join(sep)
  const basenameSplit = basename.split('.')
  let filename = basename,
    ext
  if (basenameSplit.length > 1) {
    ext = basenameSplit.pop()
    filename = basenameSplit.join('.')
  }
  return {
    basename,
    dir,
    isDir,
    filename,
    ext,
  }
}

export const parseAsOsm = (filepath) => {
  const parsed = parse(filepath)
  const ret = { ...parsed, osmBareName: '' }
  const split = parsed.filename.split('.')
  if (split[split.length - 1] === 'osm') {
    ret.osmBareName = split.slice(0, split.length - 1).join('.')
  }
  return ret
}

// console.log(parse('C:\\Windows\\some path\\foo bar.txt'))
// console.log(parse('C:\\Windows\\some path\\foo bar.txt'))
// console.log(parse('/Users/windows/some path/foo.bar.txt'))
// console.log(parse('/Users/windows/some path/'))
// console.log(parse('/Users/windows//////////some path///////'))

export default {
  join,
  dirname,
  parse,
  parseAsOsm,
}
