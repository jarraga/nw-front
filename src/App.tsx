import { RouterProvider } from 'react-router-dom'

import { router } from './routes/router'
import { InformantSessionProvider } from './session/InformantSession'

function App() {
  return (
    <InformantSessionProvider>
      <RouterProvider router={router} />
    </InformantSessionProvider>
  )
}

export default App
