import { useEffect, useState } from 'react'
import { app, events, os, updater } from '@neutralinojs/lib'
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Select,
  Text,
} from '@chakra-ui/react'
import { RxActivityLog } from 'react-icons/rx'
import Activity from '../activity'
import router from './../../router'

export default function TopBar() {
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [showActivity, setShowActivity] = useState(false)

  const [outputs, setOutputs] = useState([])
  const [stickToBottom, setStickToBottom] = useState(true)

  useEffect(() => {
    events.on('spawnedProcess', (evt) => {
      switch (evt.detail.action) {
        case 'stdOut':
          const out = evt.detail.data.split('\n')
          setOutputs((o) => [...o, ...out])
          break
        case 'stdErr':
          setOutputs((o) => [...o, `error: ${evt.detail.data}`])
          break
        case 'exit':
          setOutputs((o) => [...o, ` `])
          break
      }
    })
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

  return (
    <Flex h='100px' px={3} pt={2} bg='#303030'>
      <Flex direction='column' flexGrow={1} maxW='600px'>
        <FormControl>
          <Flex alignItems='center' border='1px solid #4d4d4d' borderRadius={5}>
            <FormLabel m={0} mb={1}>
              <Text fontSize='sm' fontWeight='bold' display='inline' mx={3}>
                Browser
              </Text>
            </FormLabel>

            <Select variant='filled' size='sm' onChange={(evt) => router.navigate(evt.target.value)}>
              <option value='/'>JOSM Validation Conversion</option>
              <option value='/osm-tag-filter'>OSM Tag Filter</option>
            </Select>
          </Flex>
        </FormControl>

        <Box mt={2}>
          <Button leftIcon={<RxActivityLog />} size='xs' onClick={showActivityWindow}>
            Activity
          </Button>
        </Box>
      </Flex>

      <Box flexGrow={1} />

      <Flex direction='column'>
        <Box mb={1}>
          <Text fontSize='sm' textAlign='right' color='gray.400'>
            Version: {NL_APPVERSION}
          </Text>
        </Box>
        <Box mb={1} textAlign='right'>
          <Button size='xs' isLoading={checkingUpdate} isDisabled={checkingUpdate} onClick={checkForUpdate}>
            Check for Update
          </Button>
        </Box>
      </Flex>

      <Drawer onClose={() => setShowActivity(false)} placement='bottom' isOpen={showActivity}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerBody p='0'>
            <Box w='100%' h='400px'>
              <Activity
                outputs={outputs}
                setOutputs={setOutputs}
                stickToBottom={stickToBottom}
                setStickToBottom={setStickToBottom}
              />
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  )
}
