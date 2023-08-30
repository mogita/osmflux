import replaceInFile from 'replace-in-file'
;(async () => {
  await replaceInFile({
    files: 'gui/index.html',
    from: /<script src="http:\/\/localhost:\d+\/__neutralino_globals\.js"><\/script>/,
    to: '<script src="/__neutralino_globals.js"></script>',
  })
})()
