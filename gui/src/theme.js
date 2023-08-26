import { mode } from '@chakra-ui/theme-tools'
import { extendTheme } from '@chakra-ui/react'

const config = {
  initialColorMode: 'system',
  useSystemColorMode: true,
}

const styles = {
  global: (props) => ({
    body: {
      bg: mode('whitealpha.900', '#282726')(props),
    },
  }),
}

const theme = extendTheme({ config, styles })
export default theme
