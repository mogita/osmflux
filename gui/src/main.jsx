import React from 'react'
import ReactDOM from 'react-dom/client'
import Router from './router.jsx'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { init } from '@neutralinojs/lib'
import theme from './theme'
import './global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <ChakraProvider theme={theme}>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <Router />
  </ChakraProvider>,
  // </React.StrictMode>,
)

init()
