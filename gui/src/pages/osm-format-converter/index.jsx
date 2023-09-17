import { useEffect, useState } from 'react'
import { filesystem, os } from '@neutralinojs/lib'
import {
  Alert,
  Box,
  Button,
  Collapse,
  Divider,
  Flex,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Text,
  Tooltip,
} from '@chakra-ui/react'
import { BsFillPlayCircleFill } from 'react-icons/bs'
import { FaInfoCircle } from 'react-icons/fa'
import { TiWarning } from 'react-icons/ti'

import { truncateFromMiddle } from '../../utils/string'
import { checkJavaVM, getCommandPath } from '../../utils/cmd'
import path from '../../utils/path'
import { getLastOpenedDir, getLastSavedDir, setLastOpenedDir, setLastSavedDir } from '../../utils/fs'

export default function OsmFormatConverter() {
  const [inputPath, setInputPath] = useState('')

  const [saveFilePath, setSaveFilePath] = useState('')
  const [saveFileName, setSaveFileName] = useState('')

  const [cmdRunning, setCmdRunning] = useState(false)
  const [javaVMReady, setJavaVMReady] = useState(true)

  useEffect(() => {
    checkJavaVM()
      .then(setJavaVMReady)
      .catch((err) => {
        console.error(err)
        os.showMessageBox('OsmFlux', 'Error checking for Java VM (JRE):\n\n' + err.toString(), 'OK', 'ERROR')
      })
  }, [])

  const openLink = (link) => {
    os.open(link)
  }

  const check = async () => {
    try {
      setCmdRunning(true)
      setJavaVMReady(await checkJavaVM())
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
    } finally {
      setCmdRunning(false)
    }
  }

  const start = async () => {
    if (cmdRunning) {
      return
    }

    if (!saveFileName) {
      return
    }

    // check save file extension
    // supported: pbf, osm, o5m
    const { ext } = path.parse(saveFileName)
    if (!~['pbf', 'osm'].indexOf(ext)) {
      await os.showMessageBox(
        'OsmFlux',
        `Saving to an unsupported file type ".${ext}"\n\nSupported extensions: .pbf .osm`,
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
      // detect from format
      let from = 'xml'
      if (path.parse(inputPath).ext === 'pbf') {
        from = 'pbf'
      }
      // detect to format
      let to = 'pbf'
      if (path.parse(saveFileName).ext === 'osm') {
        to = 'xml'
      }
      if (from === to) {
        throw new Error('Source and target format should not be the same')
      }

      await convert(from, to, inputPath, path.join(saveFilePath, saveFileName))

      await os.showMessageBox('OsmFlux', 'OSM format conversion finished', 'OK', 'INFO')
      await tryOpenInFolder()
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
    } finally {
      setCmdRunning(false)
    }
  }

  const convert = async (from, to, fromFilePath, toFilePath) => {
    try {
      const cmd = await getCommandPath('osmosis')
      const fullCmd = `"${cmd}" --read-${from} ${fromFilePath} --write-${to} ${toFilePath}`
      await os.spawnProcess(`echo "🤖 ${fullCmd}"`)
      const result = await os.execCommand(fullCmd)
      if (result.stdOut) {
        await os.spawnProcess(`echo "${result.stdOut}"`)
      }
      // java might output normal logs to the stdErr while keeping silent in stdOut
      if (result.stdErr) {
        await os.spawnProcess(`echo "${result.stdErr}"`)
      }
      if (result.exitCode > 0) {
        throw new Error('An error occured. See "Activity" for details.')
      }
    } catch (err) {
      throw err
    }
  }

  const open = async () => {
    try {
      const entries = await os.showOpenDialog('Choose File', {
        defaultPath: await getLastOpenedDir(),
        multiSelections: false,
        filters: [
          { name: 'PBF Files', extensions: ['pbf'] },
          { name: 'XML Files', extensions: ['osm'] },
        ],
      })
      if (Array.isArray(entries) && entries.length > 0) {
        setInputPath(entries[0])
        setLastOpenedDir(path.dirname(entries[0]))
        // as in the map file conversion scenario, a map file is more probably used, so try with the osm standard filename first
        const info = path.parseAsOsm(entries[0])
        const saveDir = await getLastSavedDir()
        setSaveFilePath(saveDir)
        setSaveFileName(`${info.osmBareName ? info.osmBareName : info.basename}.${info.ext === 'pbf' ? 'osm' : 'pbf'}`)
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
            Source Map File
          </Heading>
          <Button onClick={open} size='xs' colorScheme='telegram'>
            Open Map File...
          </Button>
          <Text mt={1} color='#666565' fontSize='sm'>
            {inputPath || 'Please choose an OSM map file (.pbf or .osm)'}
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
                label={
                  <Text color='whiteAlpha.800' fontSize='xs'>
                    Supported file extensions: pbf, osm.
                    <br />
                    <br />
                    Simply set a wanted file extension, OsmFlux will output to this format automatically.
                  </Text>
                }
                bg='#404040'
                placement='right'
                gutter={12}
                closeOnClick={false}
                hasArrow
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

      <Collapse in={!javaVMReady}>
        <Flex alignItems='center'>
          <Alert status='warning'>
            <Icon mr={3} as={TiWarning} boxSize={5} color='orange.300' />
            <Text fontSize='sm' mr={3}>
              Java (JRE) not detected.{' '}
              <Link
                textDecoration='underline'
                onClick={() => openLink('https://www.java.com/en/download/')}
                _hover={{ cursor: 'pointer !important' }}
              >
                Click here
              </Link>{' '}
              to download and install it, or{' '}
              <Link
                textDecoration='underline'
                onClick={() => openLink('https://cloudlinuxtech.com/java-command-not-found-error/')}
                _hover={{ cursor: 'pointer !important' }}
              >
                read this
              </Link>{' '}
              for troubleshooting. Then click the button to check again.
            </Text>
            <Button
              w={32}
              size='xs'
              colorScheme='orange'
              onClick={check}
              isDisabled={cmdRunning}
              isLoading={cmdRunning}
            >
              Check Again
            </Button>
          </Alert>
        </Flex>
      </Collapse>

      <Flex p={4} alignItems='center' justifyContent='center'>
        <Tooltip
          label={
            <Text color='whiteAlpha.800' fontSize='xs'>
              {inputPath ? '' : 'Please select an OSM map file.'}
              {inputPath ? '' : <br />}
              {inputPath && !saveFileName ? 'Save As filename cannot be empty.' : ''}
              {inputPath && !saveFileName ? <br /> : ''}
              {!javaVMReady ? 'Java VM not detected, see the warning sign for how to install.' : ''}
              {!javaVMReady ? <br /> : ''}
            </Text>
          }
          bg='#404040'
          placement='top'
          gutter={12}
          closeOnClick={false}
          hasArrow
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
