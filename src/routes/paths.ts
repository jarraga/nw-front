export const routePaths = {
  home: '/',
  customers: '/customers',
  customerDetailRoute: '/customers/:customerId',
  customerDetail: (customerId: number | string) => `/customers/${customerId}`,
} as const
