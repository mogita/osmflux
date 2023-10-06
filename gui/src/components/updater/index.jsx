import { useEffect, useState } from 'react'
import axios from 'axios'
import { filesystem, os, storage, updater, app } from '@neutralinojs/lib'
import { Button } from '@chakra-ui/react'
import dayjs from 'dayjs'

import { getCommandPath, getLocalCommandDir, getLocalCommandList, getOSInfo, getOsmosis } from '../../utils/cmd'
import { getFileMD5 } from '../../utils/fs'
import path from '../../utils/path'

const channel = NL_RELEASE_INFO?.channel === 'dev' || import.meta.env.DEV === true ? 'dev' : 'stable'

export default function Updater() {
  const [updateInProgress, setUpdateInProgress] = useState(false)

  useEffect(() => {
    autoCheckUpdate()
  }, [])

  const autoCheckUpdate = async () => {
    try {
      const now = dayjs()
      const lastCheck = await getLastUpdateCheckedAt()
      if (lastCheck) {
        // last check has a valid record
        const shouldCheckAt = now.subtract(12, 'hours')
        if (lastCheck.isAfter(shouldCheckAt)) {
          // last check is within the last 12 hours, skip this check
          return
        }
      }
      // last check is older than 12 hours ago, now let's check for update
      await setLastUpdateCheckedAt(now)
      await checkForUpdate()
    } catch (err) {
      console.error(err)
    }
  }

  const getLastUpdateCheckedAt = async () => {
    try {
      const data = await storage.getData('osmflux_last_update_checked_at')
      const lastCheckedAt = dayjs(data)
      if (!lastCheckedAt.isValid()) {
        return null
      } else {
        return lastCheckedAt
      }
    } catch (err) {
      console.error(err)
      return null
    }
  }

  const setLastUpdateCheckedAt = async (datetime) => {
    try {
      const data = dayjs(datetime)
      if (!data.isValid()) {
        throw new Error('invalid date time format as checking last update time')
      }
      await storage.setData('osmflux_last_update_checked_at', data.toString())
    } catch (err) {
      console.error(err)
    }
  }

  const checkForUpdate = async () => {
    if (updateInProgress) {
      return
    }
    try {
      setUpdateInProgress(true)
      if (channel === 'dev') {
        await os.spawnProcess(`echo "► checking update on dev channel..."`)
      }
      const url = `https://static.mogita.com/osmflux/releases/${channel}/latest/update_manifest.json?ts=${+new Date()}`
      const manifest = await updater.checkForUpdates(url)

      await updateCommands(manifest?.data?.commands)

      const osmosis = await getCommandPath('osmosis')
      try {
        await filesystem.getStats(osmosis)
      } catch (_) {
        await getOsmosis()
      }

      if (manifest.version != NL_APPVERSION) {
        const choice = await os.showMessageBox(
          'OsmFlux',
          `A newer version ${manifest.version} is available, you have ${NL_APPVERSION}. Would you like to update and restart now?`,
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
      const dir = getLocalCommandDir()
      // gather md5 checksums for local commands
      const localCommands = await getLocalCommandList()
      for (const localCmd in localCommands) {
        if (localCommands[localCmd]) {
          localCommands[localCmd].md5 = await getFileMD5(localCommands[localCmd].localPath)
        }
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
          localPath: localCommands?.[cmd]?.localPath ? localCommands[cmd].localPath : path.join(dir, cmd), // if the command is not present in local env, give it a path for later download
          remotePath: `https://static.mogita.com/osmflux/releases/${channel}/latest/commands/${remoteKey}/${info.os}/${
            info.arch
          }/${cmd}?ts=${+new Date()}`,
          remoteMD5,
          localMD5: localCommands?.[cmd]?.md5 ? localCommands[cmd].md5 : null,
        })
      }

      for (const update of toUpdate) {
        try {
          // backup, having a local md5 means the command already exists on local env
          if (update.localMD5) {
            await filesystem.moveFile(update.localPath, `${update.localPath}.bak`)
          }
          // download update
          const resp = await axios.get(update.remotePath, { responseType: 'arraybuffer' })
          await filesystem.writeBinaryFile(update.localPath, new Uint8Array(resp.data))
          // check downloaded md5 against remote md5
          const md5 = await getFileMD5(update.localPath)
          if (md5 !== update.remoteMD5) {
            // restore if not match, could be network glitch or something worse
            throw new Error(`updating command ${update.localPath}, md5 for downloaded and remote file don't match.`)
          }
          if (info.os !== 'windows') {
            // ensure command permission on unix systems
            const res = await os.execCommand(`chmod +x "${update.localPath}"`)
            if (res.stdErr || res.exitCode > 0) {
              throw new Error(`chmod failed for ${update.localPath}: ` + res.stdErr)
            }
          }
          if (update.localMD5) {
            await filesystem.removeFile(`${update.localPath}.bak`)
          }
        } catch (_) {
          // revert on error
          if (update.localMD5) {
            await filesystem.moveFile(`${update.localPath}.bak`, update.localPath)
          }
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
