export const truncateFromMiddle = (str = '', len, truncateStr = '...') => {
  if (str.length <= len) {
    return str
  }
  const midLen = truncateStr.length
  const charsToShow = len - midLen
  const frontChars = Math.ceil(charsToShow / 2)
  const backChars = Math.floor(charsToShow / 2)
  return str.substring(0, frontChars) + truncateStr + str.substring(str.length - backChars)
}
