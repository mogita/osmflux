import { useEffect, useLayoutEffect, useRef } from 'react'
import { Box, Button, Checkbox, Heading, Text, useColorModeValue } from '@chakra-ui/react'
import { BsFillTrash3Fill } from 'react-icons/bs'

export default function Activity({ outputs, setOutputs, stickToBottom, setStickToBottom }) {
  const screenEndRef = useRef(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      if (stickToBottom) {
        screenEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }, 10)
  }

  useLayoutEffect(scrollToBottom, [outputs])

  useEffect(scrollToBottom, [stickToBottom])

  const headerBgColor = useColorModeValue('#D6D6D6', '#40403f')
  const logBgColor = useColorModeValue('#F5F5F5', '#1e1e1e')

  return (
    <Box w='100%' h='100%' overflow='hidden' display='flex' flexDirection='column'>
      <Box h='40px' px={2} display='flex' alignItems='center' justifyContent='space-between' bg={headerBgColor}>
        <Box fontWeight='bold' flexGrow={1}>
          <Box display='flex' alignItems='center'>
            <Heading size='sm' mr={2}>
              Activity
            </Heading>
            <Text color='gray' fontWeight='light' fontSize='sm'>
              Press Escape to dismiss
            </Text>
          </Box>
        </Box>
        <Box display='flex' alignItems='center'>
          <Checkbox size='sm' isChecked={stickToBottom} onChange={(e) => setStickToBottom(e.target.checked)}>
            Auto-scroll
          </Checkbox>
        </Box>
        <Box ml={6} display='flex' alignItems='center'>
          <Button size='xs' leftIcon={<BsFillTrash3Fill />} onClick={() => setOutputs([])}>
            Clear Logs
          </Button>
        </Box>
      </Box>

      <Box w='100%' h='100%' p={2} fontSize={14} bg={logBgColor} overflow='scroll'>
        {outputs.map((row, idx) => (
          <pre key={idx}>
            <pre
              style={{
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                userSelect: 'text',
                WebkitUserSelect: 'text',
              }}
            >
              {row}
            </pre>
          </pre>
        ))}
        <Box ref={screenEndRef} />
      </Box>
    </Box>
  )
}
