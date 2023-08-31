import { useState } from 'react'
import axios from 'axios'
import { filesystem, os, updater } from '@neutralinojs/lib'
import { Button } from '@chakra-ui/react'
import { getLocalCommandList, getOSInfo } from '../../utils/cmd'
import { getFileMD5 } from '../../utils/fs'

export default function Updater() {
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [channel] = useState(import.meta.env.DEV === true ? 'dev' : 'stable')

  const checkForUpdate = async () => {
    if (checkingUpdate) {
      return
    }
    try {
      setCheckingUpdate(true)
      const url = `https://static.mogita.com/osmflux/releases/${channel}/latest/update_manifest.json?ts=${+new Date()}`
      const manifest = await updater.checkForUpdates(url)
      console.debug(manifest, NL_APPVERSION)

      if (manifest.version != NL_APPVERSION) {
        const choice = await os.showMessageBox(
          'OsmFlux',
          `A newer version ${manifest.version} is available, you have ${NL_APPVERSION}.\n\nWould you like to restart OsmFlux and update now?`,
          'YES_NO',
          'INFO',
        )
        if (choice === 'YES') {
          await updateCommands(manifest?.data?.commands)
          await updater.install()
          await app.restartProcess()
        }
      } else {
        os.showMessageBox('OsmFlux', 'You have the latest version of OsmFlux.', 'OK', 'INFO')
      }
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', 'Update failed:\n\n' + err.toString(), 'OK', 'ERROR')
    } finally {
      setCheckingUpdate(false)
    }
  }

  const test = async () => {
    const url = `https://static.mogita.com/osmflux/releases/${channel}/latest/update_manifest.json?ts=${+new Date()}`
    const manifest = await updater.checkForUpdates(url)
    try {
      await updateCommands(manifest?.data?.commands)
    } catch (err) {
      console.error(err)
    }
  }

  const updateCommands = async (remoteCommands) => {
    console.log(JSON.stringify(remoteCommands, null, 2))
    if (!remoteCommands) {
      console.debug('remoteCommands not set, will not update commands')
      return
    }
    try {
      // gather md5 checksums for local commands
      const localCommands = await getLocalCommandList()
      console.log('before localCommands', localCommands)
      for (const localCmd in localCommands) {
        localCommands[localCmd].md5 = await getFileMD5(localCommands[localCmd].localPath)
      }
      console.log('localCommands', localCommands)

      const info = await getOSInfo()

      const toUpdate = []

      for (const remoteKey in remoteCommands) {
        const remoteCmd = remoteCommands[remoteKey]
        const remoteMD5 = remoteCmd?.[info.os]?.[info.arch]
        const cmd = info.os === 'windows' ? remoteKey + '.exe' : remoteKey
        if (localCommands[cmd] && remoteMD5 && remoteMD5 === localCommands[cmd].md5) {
          continue
        }
        toUpdate.push({
          localPath: localCommands[cmd].localPath,
          remotePath: `https://static.mogita.com/osmflux/releases/${channel}/latest/commands/${remoteKey}/${info.os}/${
            info.arch
          }/${cmd}?ts=${+new Date()}`,
          remoteMD5,
          localMD5: localCommands[cmd].md5,
        })
      }

      console.log('toUpdate', toUpdate)

      for (const update of toUpdate) {
        try {
          // backup
          await filesystem.moveFile(update.localPath, `${update.localPath}.bak`)
          // download update
          const resp = await axios.get(update.remotePath, { responseType: 'arraybuffer' })
          await filesystem.writeBinaryFile(update.localPath, new Uint8Array(resp.data))
          // check downloaded md5 against remote md5
          const md5 = await getFileMD5(update.localPath)
          if (md5 !== update.remoteMD5) {
            // restore if not match, could be network glitch or something worse
            throw new Error(`updating command ${update.localPath}, md5 for downloaded and remote file don't match.`)
          }
          await filesystem.removeFile(`${update.localPath}.bak`)
        } catch (_) {
          // revert on error
          await filesystem.moveFile(`${update.localPath}.bak`, update.localPath)
        }
      }
    } catch (err) {
      console.error(err)
      // throw err
    }
  }

  return (
    <>
      <Button size='xs' isLoading={checkingUpdate} isDisabled={checkingUpdate} onClick={checkForUpdate}>
        Check for Update
      </Button>
      <Button size='xs' onClick={test}>
        Test
      </Button>
    </>
  )
}
