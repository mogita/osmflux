import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import JOSMValidationConverter from './pages/josm-validation-converter'

export default function router() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<JOSMValidationConverter />} />
      </Routes>
    </Router>
  )
}
