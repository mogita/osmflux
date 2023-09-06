import { useState } from 'react'
import { filesystem, os } from '@neutralinojs/lib'
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  Flex,
  Heading,
  Icon,
  Input,
  Stack,
  Tag,
  TagLabel,
  Text,
  Tooltip,
} from '@chakra-ui/react'
import { BsFillPlayCircleFill } from 'react-icons/bs'
import { FaInfoCircle } from 'react-icons/fa'

import { getLastOpenedDir, getLastSavedDir, setLastOpenedDir, setLastSavedDir } from '../../utils/fs'
import { truncateFromMiddle } from '../../utils/string'
import path from '../../utils/path'
import { getCommandPath } from '../../utils/cmd'

export default function OsmTagFilter() {
  const [pbfPath, setPBFPath] = useState('')

  const [saveFilePath, setSaveFilePath] = useState('')
  const [saveFileName, setSaveFileName] = useState('')

  const [tagsToKeep, setTagsToKeep] = useState([])
  const [cmdRunning, setCmdRunning] = useState(false)

  const start = async () => {
    if (cmdRunning) {
      return
    }

    setCmdRunning(true)

    // check save file extension
    // supported: pbf, osm, o5m
    const split = saveFileName.split('.')
    const ext = split[split.length - 1]
    if (!~['pbf', 'osm', 'o5m'].indexOf(ext)) {
      await os.showMessageBox(
        'OsmFlux',
        `Saving to an unsupported file type ".${ext}"\n\nSupported extensions: .pbf .osm .o5m`,
        'OK',
        'ERROR',
      )
      return
    }

    const info = path.parse(pbfPath)
    const inputIntermediate = path.join(saveFilePath, `${info.filename}.o5m`)

    const needOutputIntermediate = ext === 'pbf'
    const outO5m = ~['pbf', 'o5m'].indexOf(ext)
    const output = path.join(saveFilePath, `${saveFileName}${needOutputIntermediate ? '.o5m' : ''}`)

    const tags = parseTags()

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
        setCmdRunning(false)
        return
      }
    } catch (err) {
      if (err.code !== 'NE_FS_NOPATHE') {
        setCmdRunning(false)
        os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
        return
      }
    }

    // do the filtering
    try {
      // convert to o5m format for osmfilter, the temp file is stored at the save path
      await convertMapFile(pbfPath, inputIntermediate)

      const cmd = await getCommandPath('osmfilter')
      const fullCmd = `"${cmd}" ${inputIntermediate} ${tags} ${outO5m ? '--out-o5m' : ''} > ${output}`
      await os.spawnProcess(`echo '🤖 ${fullCmd}'`)
      const result = await os.execCommand(fullCmd)
      await os.spawnProcess(`echo '${result.stdOut}'`)
      if (result.stdErr) {
        await os.spawnProcess(`echo '${result.stdErr}'`)
        throw new Error('An error occured. See "Activity" for details.')
      }

      // convert the output to PBF
      if (needOutputIntermediate) {
        await convertMapFile(output, path.join(saveFilePath, saveFileName))
      }

      await os.showMessageBox('OsmFlux', 'OSM Tag Filter finished', 'OK', 'INFO')
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
    } finally {
      // remove temp files
      await filesystem.removeFile(inputIntermediate)
      if (needOutputIntermediate) {
        await filesystem.removeFile(output)
      }
      setCmdRunning(false)
    }
  }

  const convertMapFile = async (input, output) => {
    try {
      const cmd = await getCommandPath('osmconvert')
      const fullCmd = `"${cmd}" ${input} -o=${output}`
      await os.spawnProcess(`echo "🤖 ${fullCmd}"`)
      const result = await os.execCommand(fullCmd)
      await os.spawnProcess(`echo "${result.stdOut}"`)
      if (result.stdErr) {
        await os.spawnProcess(`echo "${result.stdErr}"`)
        throw new Error('An error occured. See "Activity" for details.')
      }
    } catch (err) {
      throw err
    }
  }

  const parseTags = () => {
    const categories = {
      node: [],
      way: [],
      relation: [],
    }
    for (const tag of tagsToKeep) {
      const [type, value] = tag.split('::')
      if (categories.hasOwnProperty(type)) {
        categories[type].push(value)
      }
    }
    // osmfilter works like this (take nodes for example):
    // --keep-nodes= must be provided whether we have a node tag to filter, otherwise all nodes shall not be dropped
    let result = ''
    for (const type in categories) {
      result += ` --keep-${type}s="${categories[type].join(' ')}"`
    }
    return result
  }

  const openPBF = async () => {
    try {
      const entries = await os.showOpenDialog('Choose PBF', {
        defaultPath: await getLastOpenedDir(),
        multiSelections: false,
        filters: [{ name: 'PBF Files', extensions: ['pbf'] }],
      })
      if (Array.isArray(entries) && entries.length > 0) {
        setPBFPath(entries[0])
        setLastOpenedDir(path.dirname(entries[0]))

        const info = path.parse(entries[0])
        const saveDir = await getLastSavedDir()
        setSaveFilePath(saveDir)
        setSaveFileName(`${info.filename}-filtered.pbf`)
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

  return (
    <Flex direction='column' justifyContent='space-between' h='100%' w='100%'>
      <Flex w='100%' mb={4} justifyContent='center' alignItems='center' alignContent='center'>
        <Box w='100%'>
          <Heading size='xs' mb={2}>
            Source PBF
          </Heading>
          <Button onClick={openPBF} size='xs' colorScheme='telegram'>
            Open PBF...
          </Button>
          <Text mt={1} color='#666565' fontSize='sm'>
            {pbfPath || 'Please choose a PBF file'}
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
        <Flex alignItems='center' mb={2}>
          <Heading size='xs' mr={2} pb={1}>
            Keep These Tags
          </Heading>

          <Tooltip
            label={
              <Text color='whiteAlpha.800' fontSize='xs'>
                The elements that have the selected tags will be kept in the output PBF, others to be dropped.
                Dependencies will be kept.
                <br />
                <br />
                Note: the OSM Tag Filter is currently at pre-alpha stage. Customizable tags and more filter options are
                planned. UI changes might take place in the future.
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
        </Flex>

        <CheckboxGroup onChange={setTagsToKeep}>
          <Stack direction='row' spacing={7}>
            <Checkbox value='way::highway=' size='sm'>
              <Tag variant='outline' size='sm' colorScheme='cyan' mr={2}>
                <TagLabel>Way</TagLabel>
              </Tag>
              Highway
            </Checkbox>
            <Checkbox value='way::building=' size='sm'>
              <Tag variant='outline' size='sm' colorScheme='cyan' mr={2}>
                <TagLabel>Way</TagLabel>
              </Tag>
              Building
            </Checkbox>
            <Checkbox value='node::barrier=' size='sm'>
              <Tag variant='outline' size='sm' colorScheme='green' mr={2}>
                <TagLabel>Node</TagLabel>
              </Tag>
              Barrier
            </Checkbox>
            <Checkbox value='relation::type=restriction' size='sm'>
              <Tag variant='outline' size='sm' colorScheme='purple' mr={2}>
                <TagLabel>Relation</TagLabel>
              </Tag>
              Type = Restriction
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
          <Input
            size='xs'
            value={saveFileName}
            onChange={(evt) => setSaveFileName(evt.target.value)}
            isDisabled={!pbfPath || cmdRunning}
          />
        </Box>

        <Heading size='xs' mr={2}>
          To:
        </Heading>

        <Box w='340px' mr={3}>
          <Text fontSize='xs'>{truncateFromMiddle(saveFilePath, 54)}</Text>
        </Box>

        <Button size='xs' onClick={browse} colorScheme='telegram' isDisabled={!pbfPath || cmdRunning}>
          Browse...
        </Button>
      </Flex>

      <Flex p={4} alignItems='center' justifyContent='center'>
        <Tooltip
          label={
            <Text color='whiteAlpha.800' fontSize='xs'>
              {pbfPath ? '' : 'Please select a PBF file'}
              {pbfPath ? '' : <br />}
              {tagsToKeep.length ? '' : 'Please select at least one tag to keep'}
            </Text>
          }
          bg='#404040'
          placement='top'
          gutter={12}
          closeOnClick={false}
          hasArrow
          isDisabled={pbfPath && tagsToKeep.length}
        >
          <Box minW='30%'>
            <Button
              leftIcon={<BsFillPlayCircleFill />}
              colorScheme='telegram'
              size='sm'
              w='100%'
              onClick={start}
              isDisabled={!pbfPath || tagsToKeep.length === 0 || cmdRunning}
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
