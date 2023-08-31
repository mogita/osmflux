import { useState } from 'react'
import { os } from '@neutralinojs/lib'
import { Box, Button, Flex, Spacer, Text } from '@chakra-ui/react'
import { TiArrowRepeatOutline } from 'react-icons/ti'
import { dirname, getLastOpenedDir, setLastOpenedDir } from './../../utils/fs'
import { getCommandPath } from './../../utils/cmd'

export default function JOSMValidationConverter() {
  const [xmlPath, setXmlPath] = useState('')
  const [csvPath, setCSVPath] = useState('')
  const [cmdRunning, setCmdRunning] = useState(false)

  const convert = async () => {
    if (cmdRunning) {
      return
    }
    try {
      setCmdRunning(true)
      const cmd = await getCommandPath('glancet')
      const fullCmd = `${cmd} convert-josm-validation --xml "${xmlPath}" --csv "${csvPath}"`
      await os.spawnProcess(`echo "🤖 ${fullCmd}"`)
      const result = await os.execCommand(fullCmd)
      await os.spawnProcess(`echo "${result.stdOut}"`)
      await os.spawnProcess(`echo "${result.stdErr}"`)
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
    <Flex direction='column' justifyContent='space-between' h='100%' w='100%'>
      <Flex w='100%' mb={2} justifyContent='center' alignItems='center' alignContent='center'>
        <Box w='50%'>
          <Button onClick={openXML} size='xs' colorScheme='telegram'>
            Open XML ...
          </Button>
          <Text mt={1} fontSize='sm'>
            {xmlPath || 'Please choose an XML file'}
          </Text>
        </Box>

        <Box w='50%'>
          <Button onClick={saveCSV} size='xs' colorScheme='telegram'>
            Save CSV As ...
          </Button>
          <Text mt={1} fontSize='sm'>
            {csvPath || 'Please specify where to save the csv file'}
          </Text>
        </Box>
      </Flex>

      <Box flexGrow={1} />

      <Flex px={4} py={4} mt={8} justifyContent='center' alignItems='center' alignContent='center'>
        <Button
          leftIcon={<TiArrowRepeatOutline />}
          colorScheme='telegram'
          size='sm'
          minW='30%'
          onClick={convert}
          isDisabled={!(xmlPath && csvPath)}
          isLoading={cmdRunning}
        >
          Convert
        </Button>
      </Flex>
    </Flex>
  )
}
