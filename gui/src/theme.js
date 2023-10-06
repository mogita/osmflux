import { mode } from '@chakra-ui/theme-tools'
import { defineStyleConfig, extendTheme } from '@chakra-ui/react'

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

const tooltipTheme = defineStyleConfig({
  variants: {
    osmflux: (props) => ({
      color: mode('blackAlpha.700', 'whiteAlpha.800')(props),
      bg: mode('#e9e9e9', '#404040')(props),
    }),
  },
  defaultProps: {
    variant: 'osmflux',
  },
})

const iconTheme = defineStyleConfig({
  variants: {
    osmflux: (props) => ({
      color: mode('#C0C0C0', '#717171')(props),
    }),
  },
  defaultProps: {
    variant: 'osmflux',
  },
})

const theme = extendTheme({
  config,
  styles,
  components: {
    Tooltip: tooltipTheme,
    Icon: iconTheme,
  },
})
export default theme
