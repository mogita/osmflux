import { useEffect, useState } from 'react'
import { events } from '@neutralinojs/lib'
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
import Updater from '../updater'
import router from '../../router'

export default function TopBar() {
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
          <Updater />
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
