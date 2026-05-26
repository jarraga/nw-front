import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppLayout } from '../layouts/AppLayout'
import { CustomerDetailPage } from '../pages/CustomerDetail'
import { CustomersPage } from '../pages/Customers'
import { DemoPage } from '../pages/Demo'
import { HomePage } from '../pages/Home'
import { routePaths } from './paths'

export const router = createBrowserRouter([
  {
    path: routePaths.home,
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: routePaths.customers,
        element: <CustomersPage />,
      },
      {
        path: routePaths.customerDetailRoute,
        element: <CustomerDetailPage />,
      },
      {
        path: routePaths.demo,
        element: <DemoPage />,
      },
      {
        path: '*',
        element: <Navigate to={routePaths.home} replace />,
      },
    ],
  },
])
