import { Box, Flex } from '@chakra-ui/react'
import { RouterProvider } from 'react-router-dom'

import TopBar from './components/top-bar'
import router from './router'

export default function Layout() {
  return (
    <Flex direction='column' h='100vh'>
      <Box>
        <TopBar />
      </Box>

      <Box mb={3} />

      <Box flexGrow={1} px={3}>
        <RouterProvider router={router} />
      </Box>
    </Flex>
  )
}
