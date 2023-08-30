import { Box, Flex } from '@chakra-ui/react'
import Router from './router.jsx'
import TopBar from './components/top-bar/index.jsx'

export default function Layout() {
  return (
    <Flex direction='column' h='100vh'>
      <Box>
        <TopBar />
      </Box>

      <Box flexGrow={1}>
        <Router />
      </Box>
    </Flex>
  )
}
