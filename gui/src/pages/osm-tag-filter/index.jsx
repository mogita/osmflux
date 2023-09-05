import { useState } from 'react'
import { os } from '@neutralinojs/lib'
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  Flex,
  Heading,
  Icon,
  Stack,
  Tag,
  TagLabel,
  Text,
  Tooltip,
} from '@chakra-ui/react'
import { BsFillPlayCircleFill } from 'react-icons/bs'
import { FaInfoCircle } from 'react-icons/fa'
import { dirname, getLastOpenedDir, setLastOpenedDir } from '../../utils/fs'

export default function OsmTagFilter() {
  const [pbfPath, setPBFPath] = useState('')
  const [tagsToKeep, setTagsToKeep] = useState([])

  const openPBF = async () => {
    try {
      const entries = await os.showOpenDialog('Choose PBF', {
        defaultPath: getLastOpenedDir(),
        multiSelections: false,
        filters: [{ name: 'PBF Files', extensions: ['pbf'] }],
      })
      if (Array.isArray(entries) && entries.length > 0) {
        setPBFPath(entries[0])
        setLastOpenedDir(dirname(entries[0]))
      }
    } catch (err) {
      console.error(err)
      os.showMessageBox('OsmFlux', err.toString(), 'OK', 'ERROR')
    }
  }

  return (
    <Flex direction='column' justifyContent='space-between' h='100%' w='100%'>
      <Flex alignItems='center' mb={3}>
        <Text color='#666565' fontSize='sm' fontWeight='bold' mr={4}>
          Parameters
        </Text>
        <Divider />
      </Flex>

      <Flex w='100%' mb={6} justifyContent='center' alignItems='center' alignContent='center'>
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
            <Checkbox value='w::highway=' size='sm'>
              <Tag variant='outline' size='sm' colorScheme='cyan' mr={2}>
                <TagLabel>Way</TagLabel>
              </Tag>
              Highway
            </Checkbox>
            <Checkbox value='w::building=' size='sm'>
              <Tag variant='outline' size='sm' colorScheme='cyan' mr={2}>
                <TagLabel>Way</TagLabel>
              </Tag>
              Building
            </Checkbox>
            <Checkbox value='n::barrier=' size='sm'>
              <Tag variant='outline' size='sm' colorScheme='green' mr={2}>
                <TagLabel>Node</TagLabel>
              </Tag>
              Barrier
            </Checkbox>
            <Checkbox value='r::type=restriction' size='sm'>
              <Tag variant='outline' size='sm' colorScheme='purple' mr={2}>
                <TagLabel>Relation</TagLabel>
              </Tag>
              Type = Restriction
            </Checkbox>
          </Stack>
        </CheckboxGroup>
      </Flex>

      <Box flexGrow={1} />

      <Flex px={4} py={4} justifyContent='center' alignItems='center' alignContent='center'>
        <Button
          leftIcon={<BsFillPlayCircleFill />}
          colorScheme='telegram'
          size='sm'
          minW='30%'
          onClick={null}
          isDisabled={!pbfPath || tagsToKeep.length === 0}
          isLoading={false}
        >
          Start
        </Button>
      </Flex>
    </Flex>
  )
}
