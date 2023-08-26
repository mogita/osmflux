import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Box, Button, Checkbox } from '@chakra-ui/react'
import { events } from '@neutralinojs/lib'
import { BsFillTrash3Fill } from 'react-icons/bs'

export default function Terminal() {
  const screenEndRef = useRef(null)
  const [outputs, setOutputs] = useState([])
  const [stickToBottom, setSitckToBottom] = useState(true)

  const scrollToBottom = () => {
    setTimeout(() => {
      if (stickToBottom) {
        screenEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }, 10)
  }

  useLayoutEffect(scrollToBottom, [outputs])

  useEffect(scrollToBottom, [stickToBottom])

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

  return (
    <Box w='100%' h='100%' borderRadius={6} overflow='hidden' display='flex' flexDirection='column'>
      <Box h='40px' px={2} display='flex' alignItems='center' justifyContent='space-between' bg='#40403f'>
        <Box fontWeight='bold' flexGrow={1}>
          Logs
        </Box>
        <Box display='flex' alignItems='center'>
          <Checkbox size='sm' isChecked={stickToBottom} onChange={(e) => setSitckToBottom(e.target.checked)}>
            Auto-scroll
          </Checkbox>
        </Box>
        <Box ml={6} display='flex' alignItems='center'>
          <Button size='xs' leftIcon={<BsFillTrash3Fill />} onClick={() => setOutputs([])}>
            Clear Logs
          </Button>
        </Box>
      </Box>

      <Box w='100%' h='100%' p={2} fontSize={14} bg='#1e1e1e' overflow='scroll'>
        {outputs.map((row, idx) => (
          <pre key={idx}>
            <pre
              style={{
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
