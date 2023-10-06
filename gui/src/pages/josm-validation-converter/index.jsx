import { useState } from 'react'
import { filesystem, os } from '@neutralinojs/lib'
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  Tooltip,
} from '@chakra-ui/react'
import { BsFillPlayCircleFill } from 'react-icons/bs'
import { FaInfoCircle } from 'react-icons/fa'

import { getLastOpenedDir, getLastSavedDir, setLastOpenedDir, setLastSavedDir } from './../../utils/fs'
import { getCommandPath } from './../../utils/cmd'
import path from '../../utils/path'
import { truncateFromMiddle } from '../../utils/string'

export default function JOSMValidationConverter() {
  const [inputPath, setInputPath] = useState('')

  const [saveFilePath, setSaveFilePath] = useState('')
  const [saveFileName, setSaveFileName] = useState('')

  const [cmdRunning, setCmdRunning] = useState(false)

  const start = async () => {
    if (cmdRunning) {
      return
    }
    if (!saveFileName) {
      return
    }

    // check save file extension
    // supported: csv
    const { ext } = path.parse(saveFileName)
    if (!~['csv'].indexOf(ext)) {
      await os.showMessageBox(
        'OsmFlux',
        `Saving to an unsupported file type ".${ext}"\n\nSupported extensions: .csv`,
        'OK',
        'ERROR',
      )
      return
    }

    // check if output file already exists
    try {
      await filesystem.getStats(path.join(saveFilePath, saveFileName))
      const choice = await os.showMessageBox(
        'OsmFlux',
        `Target file already exists, do you want to overwrite it?`,
        'YES_NO',
        'WARNING',
      )
      if (choice !== 'YES') {
        return
      }
    } catch (err) {
      if (err.code !== 'NE_FS_NOPATHE') {
        os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
        return
      }
    }

    try {
      setCmdRunning(true)
      const cmd = await getCommandPath('glancet')
      const fullCmd = `"${cmd}" convert-josm-validation --xml "${inputPath}" --csv "${path.join(
        saveFilePath,
        saveFileName,
      )}"`
      await os.spawnProcess(`echo '► ${fullCmd}'`)
      const result = await os.execCommand(fullCmd)
      if (result.stdOut) {
        await os.spawnProcess(`echo '${result.stdOut}'`)
      }
      if (result.stdErr) {
        await os.spawnProcess(`echo '${result.stdErr}'`)
      }
      if (result.exitCode > 0) {
        throw new Error('An error occured. See "Activity" for details.')
      }
      await os.showMessageBox('OsmFlux', 'JOSM validation conversion finished', 'OK', 'INFO')
      await tryOpenInFolder()
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
    } finally {
      setCmdRunning(false)
    }
  }

  const open = async () => {
    try {
      const entries = await os.showOpenDialog('Choose XML', {
        defaultPath: await getLastOpenedDir(),
        multiSelections: false,
        filters: [{ name: 'XML Files', extensions: ['xml'] }],
      })
      if (Array.isArray(entries) && entries.length > 0) {
        setInputPath(entries[0])
        setLastOpenedDir(path.dirname(entries[0]))

        const info = path.parse(entries[0])
        const saveDir = await getLastSavedDir()
        setSaveFilePath(saveDir)
        setSaveFileName(`${info.filename}.csv`)
      }
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
    }
  }

  const browse = async () => {
    try {
      const dir = await os.showFolderDialog('Select Directory To Save', {
        defaultPath: saveFilePath,
      })
      if (dir) {
        setSaveFilePath(dir)
        await setLastSavedDir(dir)
      }
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
    }
  }

  const tryOpenInFolder = async () => {
    try {
      if (!saveFilePath) {
        return
      }
      if (NL_OS && NL_OS.toLowerCase() !== 'windows') {
        await os.execCommand(`open "${saveFilePath}"`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Flex direction='column' justifyContent='space-between' h='100%' w='100%'>
      <Flex w='100%' mb={4} justifyContent='center' alignItems='center' alignContent='center'>
        <Box w='100%'>
          <Heading size='xs' mb={2}>
            Source XML File
          </Heading>
          <Button onClick={open} size='xs' colorScheme='telegram'>
            Open XML File...
          </Button>
          <Text mt={1} color='#666565' fontSize='sm'>
            {inputPath || 'Please choose an XML file'}
          </Text>
        </Box>
      </Flex>

      <Flex alignItems='center' mb={3}>
        <Text color='#666565' fontSize='sm' fontWeight='bold' mr={4}>
          Parameters
        </Text>
        <Divider />
      </Flex>

      <Flex w='100%' mb={6} direction='column'>
        <Text fontSize='xs' color='#666565'>
          No parameters currently
        </Text>
      </Flex>

      <Box flexGrow={1} />

      <Flex w='100%' mb={6} alignItems='center'>
        <Heading size='xs' mr={3}>
          Save As:
        </Heading>

        <Box flexGrow={1} mr={5}>
          <InputGroup>
            <Input
              size='xs'
              value={saveFileName}
              onChange={(evt) => setSaveFileName(evt.target.value)}
              isDisabled={!inputPath || cmdRunning}
              isInvalid={inputPath && !saveFileName}
            />
            <InputRightElement h='26px' mr={-1.5}>
              <Tooltip
                label={<Text fontSize='xs'>Supported file extension: csv.</Text>}
                placement='right'
                gutter={12}
                closeOnClick={false}
              >
                <Box>
                  <Icon as={FaInfoCircle} />
                </Box>
              </Tooltip>
            </InputRightElement>
          </InputGroup>
        </Box>

        <Heading size='xs' mr={2}>
          To:
        </Heading>

        <Box w='300px' mr={3} onDoubleClick={tryOpenInFolder}>
          <Text fontSize='xs'>{truncateFromMiddle(saveFilePath, 50)}</Text>
        </Box>

        <Button size='xs' onClick={browse} colorScheme='telegram' isDisabled={!inputPath || cmdRunning}>
          Browse...
        </Button>
      </Flex>

      <Flex p={4} alignItems='center' justifyContent='center'>
        <Tooltip
          label={
            <Text fontSize='xs'>
              {inputPath ? '' : 'Please select an XML file.'}
              {inputPath ? '' : <br />}
              {inputPath && !saveFileName ? 'Save As filename cannot be empty.' : ''}
              {inputPath && !saveFileName ? <br /> : ''}
            </Text>
          }
          placement='top'
          gutter={12}
          closeOnClick={false}
          isDisabled={inputPath && saveFileName}
        >
          <Box w='223px'>
            <Button
              leftIcon={<BsFillPlayCircleFill />}
              colorScheme='telegram'
              size='sm'
              w='100%'
              onClick={start}
              isDisabled={!inputPath || cmdRunning || (inputPath && !saveFileName)}
              isLoading={cmdRunning}
            >
              Start
            </Button>
          </Box>
        </Tooltip>
      </Flex>
    </Flex>
  )
}
