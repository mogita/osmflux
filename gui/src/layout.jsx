import { AbsoluteCenter, Box, Flex, Text } from '@chakra-ui/react'
import { RouterProvider } from 'react-router-dom'

import TopBar from './components/top-bar'
import router from './router'

export default function Layout() {
  return (
    <Flex direction='column' h='100vh'>
      <Box>
        <TopBar />
      </Box>

      <Box position='relative' px={3} mb={6}>
        <AbsoluteCenter bg='#2c2c2c' px={3} py={1} borderRadius={5}>
          <Text fontSize='xs' color='#a8a8a8'>
            Details
          </Text>
        </AbsoluteCenter>
      </Box>

      <Box flexGrow={1} px={3}>
        <RouterProvider router={router} />
      </Box>
    </Flex>
  )
}
