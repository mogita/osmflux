import { createBrowserRouter } from 'react-router-dom'
import JOSMValidationConverter from './pages/josm-validation-converter'
import OsmTagFilter from './pages/osm-tag-filter'

export default createBrowserRouter([
  {
    path: '/',
    element: <JOSMValidationConverter />,
  },

  {
    path: '/osm-tag-filter',
    element: <OsmTagFilter />,
  },
])
