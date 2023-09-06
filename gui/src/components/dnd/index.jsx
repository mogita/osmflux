import { Text } from '@chakra-ui/react'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

// currently drag and drop component doesn't work as expected. Neutralino doesn't set the full path in file selection via the <input /> tag. Wihtout a full path, OsmFlux cannot call the external binaries with correct file parameters. More on this topic: https://github.com/neutralinojs/neutralinojs/discussions/716#discussioncomment-6864705
//
export default function DnD({ setFiles = () => {}, accept = [], extensions = [] }) {
  const onDrop = useCallback((acceptedFiles) => {
    console.log(JSON.stringify(acceptedFiles, null, 2))
    setFiles(
      acceptedFiles.filter((f) => {
        if (Array.isArray(extensions) && extensions.length === 0) {
          // no extensions specified, don't filter anything
          return true
        }
        const parts = f.name.split('.')
        if (parts.length > 1) {
          // test file ext with every element from the extensions and return true on the first match
          return ~extensions.indexOf(parts[parts.length - 1])
        }
        return false
      }),
    )
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept })

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? <Text>Drop the file here...</Text> : <Text>Drag'n Drop Files Here</Text>}
    </div>
  )
}
