import { CUSTOMERS_URL } from '../../config/api'
import type {
  CompanyType,
  CustomerDebtSortBy,
} from '../../types/customer'

export const CUSTOMERS_DEBT_LIST_URL = `${CUSTOMERS_URL}/debt-list`
export const REVIEWED_DEBTORS_PERCENTAGE_URL = `${CUSTOMERS_URL}/reviewed-debtors-percentage`
export const PAGE_SIZE = 50
export const ALL_COMPANY_TYPES = 'all'
export const INCLUDE_REVIEWED_STORAGE_KEY = 'includeReviewed'

export type CustomerCompanyTypeFilter =
  | CompanyType
  | typeof ALL_COMPANY_TYPES

export type CreateCustomerForm = {
  companyName: string
  companyType: CompanyType
  phone: string
  email: string
  monthlyFee: string
  billingStartedAt: string
  comments: string
}

export const companyTypeLabels: Record<CompanyType, string> = {
  enterprise: 'Empresa',
  pyme: 'PyME',
  startup: 'Startup',
}

export const numberFormatter = new Intl.NumberFormat('es-AR')

export const percentFormatter = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

export function createEmptyCustomerForm(): CreateCustomerForm {
  return {
    companyName: '',
    companyType: 'enterprise',
    phone: '',
    email: '',
    monthlyFee: '',
    billingStartedAt: '',
    comments: '',
  }
}

export function readStoredIncludeReviewed() {
  const storedIncludeReviewed = localStorage.getItem(INCLUDE_REVIEWED_STORAGE_KEY)

  if (storedIncludeReviewed === null) {
    return true
  }

  return storedIncludeReviewed === 'true'
}

function normalizePercentage(value: number) {
  return value <= 1 ? value * 100 : value
}

export function getReviewedDebtorsPercentage(data: unknown) {
  if (typeof data === 'number') {
    return normalizePercentage(data)
  }

  if (!data || typeof data !== 'object') {
    return null
  }

  const record = data as Record<string, unknown>
  const rawValue =
    record.percentage ??
    record.reviewedDebtorsPercentage ??
    record.reviewedPercentage ??
    record.value

  return typeof rawValue === 'number' ? normalizePercentage(rawValue) : null
}

export function readNumberSearchParam(
  searchParams: URLSearchParams,
  key: string,
  fallback: number,
) {
  const parsedValue = Number(searchParams.get(key))

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback
}

export function readSortBySearchParam(searchParams: URLSearchParams) {
  const sortBy = searchParams.get('sortBy')

  return sortBy === 'months' || sortBy === 'amount' ? sortBy : 'amount'
}

export function readCompanyTypeSearchParam(searchParams: URLSearchParams) {
  const companyType = searchParams.get('companyType')

  if (
    companyType === 'enterprise' ||
    companyType === 'pyme' ||
    companyType === 'startup'
  ) {
    return companyType
  }

  return ALL_COMPANY_TYPES
}

export function readIncludeReviewedSearchParam(searchParams: URLSearchParams) {
  const includeReviewed = searchParams.get('includeReviewed')

  if (includeReviewed === null) {
    return readStoredIncludeReviewed()
  }

  return includeReviewed === 'true'
}

export function buildCustomersUrl(
  page: number,
  sortBy: CustomerDebtSortBy,
  companyType: CustomerCompanyTypeFilter,
  companyName: string,
  includeReviewed: boolean,
  dueDay: number | null,
) {
  const offset = (page - 1) * PAGE_SIZE
  const url = new URL(CUSTOMERS_DEBT_LIST_URL)
  url.searchParams.set('limit', PAGE_SIZE.toString())
  url.searchParams.set('offset', offset.toString())
  url.searchParams.set('sortBy', sortBy)

  if (companyType !== ALL_COMPANY_TYPES) {
    url.searchParams.set('companyType', companyType)
  }

  const trimmedCompanyName = companyName.trim()

  if (trimmedCompanyName) {
    url.searchParams.set('companyName', trimmedCompanyName)
  }

  url.searchParams.set('includeReviewed', includeReviewed.toString())

  if (dueDay !== null) {
    url.searchParams.set('dueDay', dueDay.toString())
  }

  return url.toString()
}
