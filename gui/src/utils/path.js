export const join = (...parts) => {
  let sep = '/'
  if (NL_OS?.toLowerCase() === 'windows') {
    sep = '\\'
  }
  var replace = new RegExp(sep + '{1,}', 'g')
  return parts.join(sep).replace(replace, sep)
}

export default {
  join,
}
