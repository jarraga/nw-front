import { RouterProvider } from 'react-router-dom'

import { CustomerViewersProvider } from './customer-viewers/CustomerViewers'
import { router } from './routes/router'
import { InformantSessionProvider } from './session/InformantSession'

function App() {
  return (
    <InformantSessionProvider>
      <CustomerViewersProvider>
        <RouterProvider router={router} />
      </CustomerViewersProvider>
    </InformantSessionProvider>
  )
}

export default App
