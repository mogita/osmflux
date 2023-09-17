import { createBrowserRouter } from 'react-router-dom'
import JOSMValidationConverter from './pages/josm-validation-converter'
import OsmTagFilter from './pages/osm-tag-filter'
import OsmFormatConverter from './pages/osm-format-converter'

export default createBrowserRouter([
  {
    path: '/josm-validation-converter',
    element: <JOSMValidationConverter />,
  },
  {
    path: '/osm-tag-filter',
    element: <OsmTagFilter />,
  },
  {
    path: '/osm-format-converter',
    element: <OsmFormatConverter />,
  },
])
