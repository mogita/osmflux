import { useEffect, useState } from 'react'
import { events } from '@neutralinojs/lib'
import { Box, Button, Drawer, DrawerBody, DrawerContent, DrawerOverlay, Flex, Heading, Text } from '@chakra-ui/react'
import Activity from '../activity'
import Updater from '../updater'

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
    <Flex h='120px' px={3} pt={2}>
      <Box flexGrow={1}>
        <Heading>OsmFlux</Heading>
        <Heading size='md'>JOSM Validation Converter</Heading>
      </Box>

      <Flex direction='column'>
        <Box mb={1}>
          <Text fontSize='sm' textAlign='right' color='gray.400'>
            Version: {NL_APPVERSION}
          </Text>
        </Box>
        <Box mb={1} textAlign='right'>
          <Updater />
        </Box>
        <Box textAlign='right'>
          <Button size='xs' onClick={showActivityWindow}>
            Activity
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
