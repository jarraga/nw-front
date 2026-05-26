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
  review?: CustomerReview
}

export type CustomerReview = {
  reviewedAt: string | null
  reviewedUntil: string | null
  reviewedBy: string | null
  isReviewed: boolean
}

export type CustomerDebt = {
  id: number
  companyName: string
  companyType: CompanyType
  monthlyFee: number
  billingStartedAt: string
  comments: string
  overdueMonths: number
  overdueAmount: number
  review: CustomerReview
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
  informantName: string
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
  review?: CustomerReview
}

export type CustomerBehavior = {
  invoices: number
  paidOnTime: number
  paidLate: number
  latePaymentPercentage: number
  averageLateDays: number
}

export type CustomerDetailResponse = {
  customer: Customer
  debt: CustomerDebtSummary
  review?: CustomerReview
  behavior: CustomerBehavior
  actions: CustomerAction[]
  payments: CustomerPayment[]
}
