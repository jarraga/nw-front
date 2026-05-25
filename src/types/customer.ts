export type CompanyType = 'enterprise' | 'pyme' | 'startup'
export type CustomerDebtSortBy = 'amount' | 'months'
export type CustomerActionType = 'call' | 'email' | 'personal_visit' | 'other'
export type CustomerPaymentStatus = 'paid' | 'unpaid'

export type Customer = {
  id: number
  companyName: string
  companyType: CompanyType
  phone: string
  email: string
  monthlyFee: number
  billingStartedAt: string
  comments: string
  createdAt: string
}

export type CustomerDebt = {
  id: number
  companyName: string
  companyType: CompanyType
  phone: string
  email: string
  monthlyFee: number
  billingStartedAt: string
  comments: string
  overdueMonths: number
  overdueAmount: number
}

export type CustomerDebtListResponse = {
  items: CustomerDebt[]
  total: number
}

export type CustomerAction = {
  id: number
  customerID: number
  type: CustomerActionType
  comments: string
  actionDate: string
  createdAt: string
}

export type CustomerPayment = {
  id: number
  customerID: number
  year: number
  month: number
  status: CustomerPaymentStatus
  paidAt: string | null
  createdAt: string
}

export type CustomerDebtSummary = {
  dueDay: number
  overdueMonths: number
  overdueAmount: number
}

export type CustomerDetailResponse = {
  customer: Customer
  debt: CustomerDebtSummary
  actions: CustomerAction[]
  payments: CustomerPayment[]
}
