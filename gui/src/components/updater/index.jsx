import { useState } from 'react'
import { os, updater } from '@neutralinojs/lib'
import { Button } from '@chakra-ui/react'

export default function Updater() {
  const [checkingUpdate, setCheckingUpdate] = useState(false)

  const checkForUpdate = async () => {
    if (checkingUpdate) {
      return
    }
    try {
      setCheckingUpdate(true)
      const url = `https://static.mogita.com/osmflux/releases/stable/latest/update_manifest.json?ts=${+new Date()}`
      const manifest = await updater.checkForUpdates(url)
      console.log(manifest, NL_APPVERSION)

      if (manifest.version != NL_APPVERSION) {
        const choice = await os.showMessageBox(
          'OsmFlux',
          `A newer version ${manifest.version} is available, you have ${NL_APPVERSION}.\n\nWoudl you like to restart OsmFlux and update now?`,
          'YES_NO',
          'INFO',
        )
        if (choice === 'YES') {
          await updater.install()
          await app.restartProcess()
        }
      } else {
        os.showMessageBox('OsmFlux', 'You have the latest version of OsmFlux.', 'OK', 'INFO')
      }
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
    } finally {
      setCheckingUpdate(false)
    }
  }

  return (
    <Button size='xs' isLoading={checkingUpdate} isDisabled={checkingUpdate} onClick={checkForUpdate}>
      Check for Update
    </Button>
  )
}
