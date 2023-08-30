import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { init } from '@neutralinojs/lib'
import theme from './theme'
import './global.css'
import Layout from './layout'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <ChakraProvider theme={theme}>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <Layout />
  </ChakraProvider>,
  // </React.StrictMode>,
)

init()
