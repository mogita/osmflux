import { useState } from 'react'
import axios from 'axios'
import { filesystem, os, updater } from '@neutralinojs/lib'
import { Button } from '@chakra-ui/react'
import { getLocalCommandList, getOSInfo } from '../../utils/cmd'
import { getFileMD5 } from '../../utils/fs'

export default function Updater() {
  const [updateInProgress, setUpdateInProgress] = useState(false)
  const [channel] = useState(import.meta.env.DEV === true ? 'dev' : 'stable')

  const checkForUpdate = async () => {
    if (updateInProgress) {
      return
    }
    try {
      setUpdateInProgress(true)
      const url = `https://static.mogita.com/osmflux/releases/${channel}/latest/update_manifest.json?ts=${+new Date()}`
      const manifest = await updater.checkForUpdates(url)

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
      setUpdateInProgress(false)
    }
  }

  // TODO: currently only does command adding or update, no deletion to the obsolete commands will be performed
  const updateCommands = async (remoteCommands) => {
    if (!remoteCommands) {
      console.debug('remoteCommands not set, will not update commands')
      return
    }
    try {
      // gather md5 checksums for local commands
      const localCommands = await getLocalCommandList()
      for (const localCmd in localCommands) {
        localCommands[localCmd].md5 = await getFileMD5(localCommands[localCmd].localPath)
      }

      const info = await getOSInfo()
      const toUpdate = []

      for (const remoteKey in remoteCommands) {
        const remoteCmd = remoteCommands[remoteKey]
        const remoteMD5 = remoteCmd?.[info.os]?.[info.arch]
        const cmd = info.os === 'windows' ? remoteKey + '.exe' : remoteKey
        if (localCommands[cmd] && remoteMD5 && remoteMD5 === localCommands[cmd].md5) {
          continue
        }
        // if local commands don't have the remote command, or the local comman's md5 is different than the remote
        // command's md5, update the command to remote version
        toUpdate.push({
          localPath: localCommands[cmd].localPath,
          remotePath: `https://static.mogita.com/osmflux/releases/${channel}/latest/commands/${remoteKey}/${info.os}/${
            info.arch
          }/${cmd}?ts=${+new Date()}`,
          remoteMD5,
          localMD5: localCommands[cmd].md5,
        })
      }

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
      throw err
    }
  }

  return (
    <>
      <Button size='xs' isLoading={updateInProgress} isDisabled={updateInProgress} onClick={checkForUpdate}>
        Check for Update
      </Button>
    </>
  )
}
