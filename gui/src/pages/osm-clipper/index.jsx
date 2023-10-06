import { useEffect, useState } from 'react'
import { filesystem, os } from '@neutralinojs/lib'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Collapse,
  Divider,
  Flex,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Stack,
  Tag,
  TagLabel,
  Text,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(duration)
dayjs.extend(relativeTime)
import { BsFillPlayCircleFill } from 'react-icons/bs'
import { FaInfoCircle } from 'react-icons/fa'
import { TiWarning } from 'react-icons/ti'

import { truncateFromMiddle } from '../../utils/string'
import { checkJavaVM, getCommandPath, getOsmosis } from '../../utils/cmd'
import path from '../../utils/path'
import { getLastOpenedDir, getLastSavedDir, setLastOpenedDir, setLastSavedDir } from '../../utils/fs'
import { geojsonToPoly } from '../../utils/geojson'

export default function OsmClipper() {
  const [inputPath, setInputPath] = useState('')
  const [shapeFilePath, setShapeFilePath] = useState('')

  const [completeWays, setCompleteWays] = useState(false)
  const [completeRelations, setCompleteRelations] = useState(false)
  const [cascadingRelations, setCascadingRelations] = useState(false)
  const [clipIncompleteEntities, setClipIncompleteEntities] = useState(true)

  const [saveFilePath, setSaveFilePath] = useState('')
  const [saveFileName, setSaveFileName] = useState('')

  const [cmdRunning, setCmdRunning] = useState(false)
  const [javaVMReady, setJavaVMReady] = useState(true)
  const [cmdElapsedSecs, setCmdElapsedSecs] = useState(0)

  useEffect(() => {
    setCmdElapsedSecs(0)
  }, [])

  useEffect(() => {
    ;(async function () {
      setCmdRunning(true)
      const osmosis = await getCommandPath('osmosis')
      try {
        await filesystem.getStats(osmosis)
      } catch (_) {
        await getOsmosis()
      } finally {
        setCmdRunning(false)
      }
    })()
  }, [])

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

    let elapTime = 0
    const timer = setInterval(() => {
      elapTime++
      setCmdElapsedSecs(elapTime)
    }, 1000)

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

      let shapeFileToUse = shapeFilePath
      let shouldRemoveTempFile = false
      // convert geojson to poly first
      const { ext: shapeFileExt } = path.parse(shapeFilePath)
      if (~['json', 'geojson'].indexOf(shapeFileExt)) {
        shapeFileToUse = await convertToPoly(shapeFilePath)
        shouldRemoveTempFile = true
      }

      await clip(from, to, inputPath, path.join(saveFilePath, saveFileName), shapeFileToUse)

      if (shouldRemoveTempFile) {
        try {
          await filesystem.removeFile(shapeFileToUse)
        } catch (err) {
          console.warn(err)
        }
      }

      await tryOpenInFolder()
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
    } finally {
      setCmdRunning(false)
      clearInterval(timer)
      setCmdElapsedSecs(0)
    }
  }

  const clip = async (from, to, fromFilePath, toFilePath, shapeFile) => {
    try {
      const cmd = await getCommandPath('osmosis')
      const fullCmd = `"${cmd}" --read-${from} "${fromFilePath}" --bounding-polygon file="${shapeFile}" clipIncompleteEntities=${
        clipIncompleteEntities ? 'true' : 'false'
      } completeWays=${completeWays ? 'yes' : 'no'} completeRelations=${
        completeRelations ? 'yes' : 'no'
      } cascadingRelations=${cascadingRelations ? 'yes' : 'no'} --write-${to} "${toFilePath}"`
      await os.spawnProcess(`echo "► ${fullCmd}"`)
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

  const convertToPoly = async (input) => {
    try {
      const inputData = await filesystem.readFile(input)
      const polyData = geojsonToPoly(JSON.parse(inputData))

      // saving the temp poly file
      const info = path.parse(input)
      const tempPath = path.join(info.dir, `${info.filename}-${+new Date()}.poly`)
      await filesystem.writeFile(tempPath, polyData)
      return tempPath
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
        const info = path.parse(entries[0])
        const saveDir = await getLastSavedDir()
        setSaveFilePath(saveDir)
        setSaveFileName(`${info.filename}-clipped.${info.ext}`)
      }
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
    }
  }

  const openShapeFile = async () => {
    try {
      const entries = await os.showOpenDialog('Choose File', {
        defaultPath: await getLastOpenedDir(),
        multiSelections: false,
        filters: [
          { name: 'GeoJSON Files', extensions: ['geojson', 'json'] },
          { name: 'Poly Files', extensions: ['poly'] },
        ],
      })
      if (Array.isArray(entries) && entries.length > 0) {
        setShapeFilePath(entries[0])
        setLastOpenedDir(path.dirname(entries[0]))
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

  const countDownColor = useColorModeValue('blackAlpha.800', 'whiteAlpha.800')
  const tooltipColor = useColorModeValue('blackAlpha.700', 'whiteAlpha.800')
  const tooltipBgColor = useColorModeValue('#e9e9e9', '#404040')

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
        <Box w='100%'>
          <Heading size='xs' mb={2}>
            Shape File
          </Heading>
          <Button onClick={openShapeFile} size='xs' colorScheme='telegram'>
            Open Shape File...
          </Button>
          <Text mt={1} color='#666565' fontSize='sm'>
            {shapeFilePath || 'Please choose a shape file (.poly, .json or .geojson)'}
          </Text>
        </Box>
      </Flex>

      <Flex w='100%' mb={6} direction='column'>
        <Flex alignItems='center' mb={2}>
          <Heading size='xs' mr={2} pb={1}>
            Options
          </Heading>
        </Flex>

        <CheckboxGroup>
          <Stack direction='row' spacing={7}>
            <Checkbox
              size='sm'
              isChecked={clipIncompleteEntities}
              onChange={(e) => setClipIncompleteEntities(e.target.checked)}
            >
              <Flex alignItems='center'>
                <Text>Clip Incomplete Entities</Text>
                <Tooltip
                  label={
                    <Text fontSize='xs'>
                      Specifies what the behaviour should be when entities are encountered that have missing
                      relationships with other entities. For example, ways with missing nodes, and relations with
                      missing members. This occurs most often at the boundaries of selection areas, but may also occur
                      due to referential integrity issues in the database or inconsistencies in the planet file snapshot
                      creation. If set to true the entities are modified to remove the missing references, otherwise
                      they're left intact.
                      <br />
                      <br />
                      Default: on
                    </Text>
                  }
                  placement='right'
                  gutter={12}
                  closeOnClick={false}
                >
                  <Box pt={1} ml={2}>
                    <Icon as={FaInfoCircle} />
                  </Box>
                </Tooltip>
              </Flex>
            </Checkbox>
            <Checkbox isChecked={completeWays} onChange={(e) => setCompleteWays(e.target.checked)} size='sm'>
              <Flex alignItems='center'>
                <Text>Complete Ways</Text>
                <Tooltip
                  label={
                    <Text fontSize='xs'>
                      Include all available nodes for ways which have at least one node in the shape boundaries.
                      Supersedes "Cascading Relations".
                      <br />
                      <br />
                      Default: off
                    </Text>
                  }
                  placement='right'
                  gutter={12}
                  closeOnClick={false}
                >
                  <Box pt={1} ml={2}>
                    <Icon as={FaInfoCircle} />
                  </Box>
                </Tooltip>
              </Flex>
            </Checkbox>
            <Checkbox isChecked={completeRelations} onChange={(e) => setCompleteRelations(e.target.checked)} size='sm'>
              <Flex alignItems='center'>
                <Text>Complete Relations</Text>
                <Tooltip
                  label={
                    <Text fontSize='xs'>
                      Include all available relations which are members of relations which have at least one member in
                      the shape boundaries. Implies "Complete Ways". Supersedes "Cascading Relations".
                      <br />
                      <br />
                      Default: off
                    </Text>
                  }
                  placement='right'
                  gutter={12}
                  closeOnClick={false}
                >
                  <Box pt={1} ml={2}>
                    <Icon as={FaInfoCircle} />
                  </Box>
                </Tooltip>
              </Flex>
            </Checkbox>
            <Checkbox
              isChecked={cascadingRelations}
              onChange={(e) => setCascadingRelations(e.target.checked)}
              size='sm'
            >
              <Flex alignItems='center'>
                <Text>Cascading Realtions</Text>
                <Tooltip
                  label={
                    <Text fontSize='xs'>
                      If a relation is selected for inclusion, always include all its parents as well. Without this
                      flag, whether or not the parent of an included relation is included can depend on the order in
                      which they appear - if the parent relation is processed but at the time it is not known that it
                      will become "relevant" by way of a child relation, then it is not included. With this flag, all
                      relations are read before a decision is made which ones to include. This flag is not required, and
                      will be ignored, if either "Complete Ways" or "Complete Relations" is set, as those flags
                      automatically create a temporary list of all relations and thus allow proper parent selection.
                      <br />
                      <br />
                      "Cascading Relations", however, uses less resources than those options because it only requires
                      temporary storage for relations.
                      <br />
                      <br />
                      Default: off
                    </Text>
                  }
                  placement='right'
                  gutter={12}
                  closeOnClick={false}
                >
                  <Box pt={1} ml={2}>
                    <Icon as={FaInfoCircle} />
                  </Box>
                </Tooltip>
              </Flex>
            </Checkbox>
          </Stack>
        </CheckboxGroup>
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
                  <Text fontSize='xs'>
                    Supported file extensions: pbf, osm.
                    <br />
                    <br />
                    Simply set a wanted file extension, OsmFlux will output to this format automatically.
                  </Text>
                }
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

      <Collapse in={cmdElapsedSecs}>
        <Flex alignItems='center' justifyContent='center'>
          <Box>
            <Text textAlign='center' color={countDownColor} fontSize='xs'>
              Elapsed Time:{' '}
              {dayjs
                .duration(cmdElapsedSecs, 'seconds')
                .format(cmdElapsedSecs >= 3600 ? 'HH:mm:ss' : cmdElapsedSecs >= 60 ? 'mm:ss' : 's')}
              {cmdElapsedSecs < 60 ? ' seconds' : ''}
            </Text>
            <Collapse in={cmdElapsedSecs > 30}>
              <Text textAlign='center' color={countDownColor} fontSize='xs'>
                Larger maps might take significantly longer to process
              </Text>
            </Collapse>
          </Box>
        </Flex>
      </Collapse>

      <Flex p={4} alignItems='center' justifyContent='center'>
        <Tooltip
          label={
            <Text fontSize='xs'>
              {inputPath ? '' : 'Please select an OSM map file.'}
              {inputPath ? '' : <br />}
              {inputPath && !saveFileName ? 'Save As filename cannot be empty.' : ''}
              {inputPath && !saveFileName ? <br /> : ''}
              {inputPath && !shapeFilePath ? 'Please select a shape file.' : ''}
              {inputPath && !shapeFilePath ? <br /> : ''}
              {!javaVMReady ? 'Java VM not detected, see the warning sign for how to install.' : ''}
              {!javaVMReady ? <br /> : ''}
            </Text>
          }
          placement='top'
          gutter={12}
          closeOnClick={false}
          isDisabled={inputPath && saveFileName && shapeFilePath && javaVMReady}
        >
          <Box w='223px'>
            <Button
              leftIcon={<BsFillPlayCircleFill />}
              colorScheme='telegram'
              size='sm'
              w='100%'
              onClick={start}
              isDisabled={!inputPath || cmdRunning || (inputPath && (!saveFileName || !shapeFilePath))}
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
