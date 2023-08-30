import { useEffect, useState } from 'react'
import { app, os, updater, window as win } from '@neutralinojs/lib'
import { Box, Button, Drawer, DrawerBody, DrawerContent, DrawerOverlay, Heading, Text } from '@chakra-ui/react'
import { TiArrowRepeatOutline } from 'react-icons/ti'
import { dirname, getLastOpenedDir, setLastOpenedDir } from './../../utils/fs'
import { getCommandPath } from './../../utils/cmd'
import Activity from '../../components/activity'

export default function JOSMValidationConverter() {
  const [xmlPath, setXmlPath] = useState('')
  const [csvPath, setCSVPath] = useState('')
  const [cmdRunning, setCmdRunning] = useState(false)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [showActivity, setShowActivity] = useState(false)

  useEffect(() => {
    console.log(window)
  }, [])

  const showActivityWindow = async () => {
    setShowActivity(true)
  }

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

  const convert = async () => {
    if (cmdRunning) {
      return
    }
    try {
      setCmdRunning(true)
      const cmd = await getCommandPath('glancet')
      const fullCmd = `${cmd} convert-josm-validation --xml ${xmlPath} --csv ${csvPath}`
      await os.spawnProcess(`echo "🤖 ${fullCmd}"`)
      await os.spawnProcess(fullCmd)
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
    } finally {
      setCmdRunning(false)
    }
  }

  const openXML = async () => {
    try {
      const entries = await os.showOpenDialog('Choose XML', {
        defaultPath: getLastOpenedDir(),
        multiSelections: false,
        filters: [{ name: 'XML Files', extensions: ['xml'] }],
      })
      if (Array.isArray(entries) && entries.length > 0) {
        setXmlPath(entries[0])
        setLastOpenedDir(dirname(entries[0]))
      }
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
    }
  }

  const saveCSV = async () => {
    try {
      const filename = await os.showSaveDialog('Save CSV As', {
        defaultPath: getLastOpenedDir(),
        multiSelections: false,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      })
      if (filename) {
        setCSVPath(filename)
        setLastOpenedDir(dirname(filename))
      }
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
    }
  }

  return (
    <Box display='flex' flexDirection='column' justifyContent='space-between' h='100vh' w='100vw'>
      <Box display='flex' flexDirection='column' p={4} w='100%' h='100%'>
        <Box mb={16} display='flex'>
          <Box flexGrow={1}>
            <Heading>OsmFlux</Heading>
            <Heading size='md'>JOSM Validation Converter</Heading>
          </Box>

          <Box display='flex' flexDirection='column'>
            <Box mb={1}>
              <Text fontSize='sm' textAlign='right' color='gray.400'>
                Version: {NL_APPVERSION}
              </Text>
            </Box>
            <Box flexGrow={1} textAlign='right'>
              <Button size='xs' isLoading={checkingUpdate} isDisabled={checkingUpdate} onClick={checkForUpdate}>
                Check for Update
              </Button>
            </Box>
            <Box flexGrow={1} textAlign='right'>
              <Button size='xs' onClick={showActivityWindow}>
                Activity
              </Button>
            </Box>
          </Box>
        </Box>

        <Box display='flex' w='100%' mb={2} justifyContent='center' alignItems='center' alignContent='center'>
          <Box w='50%'>
            <Button onClick={openXML} colorScheme='telegram'>
              Open XML
            </Button>
            <Text>{xmlPath || 'Please choose an XML file'}</Text>
          </Box>

          <Box w='50%'>
            <Button onClick={saveCSV} colorScheme='telegram'>
              Save CSV As
            </Button>
            <Text>{csvPath || 'Please specify where to save the csv file'}</Text>
          </Box>
        </Box>

        <Box mt={8} display='flex' justifyContent='center' alignItems='center' alignContent='center'>
          <Button
            leftIcon={<TiArrowRepeatOutline />}
            colorScheme='telegram'
            w='100%'
            onClick={convert}
            isDisabled={!(xmlPath && csvPath)}
            isLoading={cmdRunning}
          >
            Convert
          </Button>
        </Box>
      </Box>

      <Drawer onClose={() => setShowActivity(false)} placement='bottom' isOpen={showActivity}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerBody p='0'>
            <Box w='100%' h='460px'>
              <Activity />
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}
