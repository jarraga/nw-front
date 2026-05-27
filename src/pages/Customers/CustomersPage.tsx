import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  LoadingOverlay,
  Pagination,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconUsers } from '@tabler/icons-react'

import { CUSTOMERS_URL } from '../../config/api'
import { useInformantSession } from '../../session/InformantSession'
import type { AsyncStatus } from '../../types/async-status'
import type {
  CompanyType,
  CustomerDebt,
  CustomerDebtListResponse,
  CustomerDebtSortBy,
} from '../../types/customer'
import { getErrorMessage } from '../../utils/error-message'
import { CreateCustomerModal } from './CreateCustomerModal'
import { CustomerFilters } from './CustomerFilters'
import {
  CUSTOMERS_SEARCH_STORAGE_KEY,
  LAST_VISITED_CUSTOMER_STORAGE_KEY,
} from './customerListState'
import { CustomersTable } from './CustomersTable'
import {
  ALL_COMPANY_TYPES,
  buildCustomersUrl,
  createEmptyCustomerForm,
  type CreateCustomerForm,
  type CustomerCompanyTypeFilter,
  getReviewedDebtorsPercentage,
  INCLUDE_REVIEWED_STORAGE_KEY,
  numberFormatter,
  PAGE_SIZE,
  percentFormatter,
  readCompanyTypeSearchParam,
  readIncludeReviewedSearchParam,
  readNumberSearchParam,
  readSortBySearchParam,
  REVIEWED_DEBTORS_PERCENTAGE_URL,
} from './customersHelpers'

export function CustomersPage() {
  const { dueDay } = useInformantSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const companyNameInputRef = useRef<HTMLInputElement>(null)
  const companyNameDebounceRef = useRef<number | null>(null)
  const [status, setStatus] = useState<AsyncStatus>('loading')
  const [hasLoadedCustomers, setHasLoadedCustomers] = useState(false)
  const [customers, setCustomers] = useState<CustomerDebt[]>([])
  const [total, setTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activePage, setActivePage] = useState(() =>
    readNumberSearchParam(searchParams, 'page', 1),
  )
  const [sortBy, setSortBy] = useState<CustomerDebtSortBy>(() =>
    readSortBySearchParam(searchParams),
  )
  const [companyName, setCompanyName] = useState(
    () => searchParams.get('companyName') ?? '',
  )
  const [debouncedCompanyName, setDebouncedCompanyName] = useState(
    () => searchParams.get('companyName') ?? '',
  )
  const [companyType, setCompanyType] = useState<CustomerCompanyTypeFilter>(
    () => readCompanyTypeSearchParam(searchParams),
  )
  const [includeReviewed, setIncludeReviewed] = useState(
    () => readIncludeReviewedSearchParam(searchParams),
  )
  const [lastVisitedCustomerID, setLastVisitedCustomerID] = useState(
    () => localStorage.getItem(LAST_VISITED_CUSTOMER_STORAGE_KEY)?.trim() ?? '',
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState(createEmptyCustomerForm)
  const [isCreating, setIsCreating] = useState(false)
  const [createErrorMessage, setCreateErrorMessage] = useState('')
  const [reviewedDebtorsPercentage, setReviewedDebtorsPercentage] = useState<
    number | null
  >(null)
  const [reviewedDebtorsPercentageStatus, setReviewedDebtorsPercentageStatus] =
    useState<AsyncStatus>('loading')

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentSearch = `?${searchParams.toString()}`
  const hasCustomers = customers.length > 0
  const hasActiveFilters =
    companyName.trim() !== '' ||
    companyType !== ALL_COMPANY_TYPES ||
    sortBy !== 'amount' ||
    !includeReviewed

  useEffect(() => {
    const nextSearchParams = new URLSearchParams()

    nextSearchParams.set('page', activePage.toString())
    nextSearchParams.set('sortBy', sortBy)
    nextSearchParams.set('includeReviewed', includeReviewed.toString())

    if (companyName.trim()) {
      nextSearchParams.set('companyName', companyName.trim())
    }

    if (companyType !== ALL_COMPANY_TYPES) {
      nextSearchParams.set('companyType', companyType)
    }

    setSearchParams(nextSearchParams, { replace: true })
    localStorage.setItem(
      CUSTOMERS_SEARCH_STORAGE_KEY,
      `?${nextSearchParams.toString()}`,
    )
  }, [
    activePage,
    companyName,
    companyType,
    includeReviewed,
    setSearchParams,
    sortBy,
  ])

  useEffect(() => {
    if (companyNameDebounceRef.current !== null) {
      window.clearTimeout(companyNameDebounceRef.current)
    }

    companyNameDebounceRef.current = window.setTimeout(() => {
      setDebouncedCompanyName(companyName)
      companyNameDebounceRef.current = null
    }, 500)

    return () => {
      if (companyNameDebounceRef.current !== null) {
        window.clearTimeout(companyNameDebounceRef.current)
        companyNameDebounceRef.current = null
      }
    }
  }, [companyName])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchReviewedDebtorsPercentage() {
      try {
        setReviewedDebtorsPercentageStatus('loading')

        const response = await fetch(REVIEWED_DEBTORS_PERCENTAGE_URL, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('No se pudo obtener el porcentaje de revisados.')
        }

        const data = await response.json()
        setReviewedDebtorsPercentage(getReviewedDebtorsPercentage(data))
        setReviewedDebtorsPercentageStatus('ok')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setReviewedDebtorsPercentage(null)
        setReviewedDebtorsPercentageStatus('error')
      }
    }

    void fetchReviewedDebtorsPercentage()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchCustomers() {
      try {
        setStatus('loading')
        setErrorMessage('')

        const response = await fetch(
          buildCustomersUrl(
            activePage,
            sortBy,
            companyType,
            debouncedCompanyName,
            includeReviewed,
            dueDay,
          ),
          {
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de clientes.')
        }

        const data = (await response.json()) as CustomerDebtListResponse
        setCustomers(data.items)
        setTotal(data.total)
        setLastVisitedCustomerID(
          localStorage.getItem(LAST_VISITED_CUSTOMER_STORAGE_KEY)?.trim() ?? '',
        )
        setHasLoadedCustomers(true)
        setStatus('ok')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setErrorMessage(getErrorMessage(error))
        setStatus('error')
      }
    }

    void fetchCustomers()

    return () => controller.abort()
  }, [
    activePage,
    sortBy,
    companyType,
    debouncedCompanyName,
    dueDay,
    includeReviewed,
    refreshKey,
  ])

  function handleSortChange(value: string) {
    setSortBy(value as CustomerDebtSortBy)
    setActivePage(1)
  }

  function handleCompanyTypeChange(value: string | null) {
    setCompanyType((value ?? ALL_COMPANY_TYPES) as CustomerCompanyTypeFilter)
    setActivePage(1)
  }

  function handleCompanyNameChange(value: string) {
    setCompanyName(value)
    setActivePage(1)
  }

  function handleClearCompanyName() {
    clearCompanyNameDebounce()
    setCompanyName('')
    setDebouncedCompanyName('')
    setActivePage(1)
    companyNameInputRef.current?.focus()
  }

  function handleIncludeReviewedChange(value: boolean) {
    localStorage.setItem(INCLUDE_REVIEWED_STORAGE_KEY, value.toString())
    setIncludeReviewed(value)
    setActivePage(1)
  }

  function handleResetFilters() {
    clearCompanyNameDebounce()
    localStorage.setItem(INCLUDE_REVIEWED_STORAGE_KEY, 'true')
    setCompanyName('')
    setDebouncedCompanyName('')
    setSortBy('amount')
    setCompanyType(ALL_COMPANY_TYPES)
    setIncludeReviewed(true)
    setActivePage(1)
    companyNameInputRef.current?.focus()
  }

  function clearCompanyNameDebounce() {
    if (companyNameDebounceRef.current !== null) {
      window.clearTimeout(companyNameDebounceRef.current)
      companyNameDebounceRef.current = null
    }
  }

  function handleCreateFormChange(
    field: keyof CreateCustomerForm,
    value: string,
  ) {
    setCreateForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  function handleCloseCreateModal() {
    if (isCreating) {
      return
    }

    setIsCreateModalOpen(false)
    setCreateErrorMessage('')
  }

  async function handleCreateCustomer() {
    const monthlyFee = Number(createForm.monthlyFee)

    if (!Number.isFinite(monthlyFee)) {
      setCreateErrorMessage('El abono mensual no es valido.')
      return
    }

    try {
      setIsCreating(true)
      setCreateErrorMessage('')

      const body: {
        companyName: string
        companyType: CompanyType
        phone?: string
        email?: string
        monthlyFee: number
        billingStartedAt: string
        comments?: string
      } = {
        companyName: createForm.companyName.trim(),
        companyType: createForm.companyType,
        monthlyFee,
        billingStartedAt: createForm.billingStartedAt,
      }

      if (createForm.phone.trim()) {
        body.phone = createForm.phone.trim()
      }

      if (createForm.email.trim()) {
        body.email = createForm.email.trim()
      }

      if (createForm.comments.trim()) {
        body.comments = createForm.comments.trim()
      }

      const response = await fetch(CUSTOMERS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error('No se pudo crear el cliente.')
      }

      setCreateForm(createEmptyCustomerForm())
      setIsCreateModalOpen(false)
      setActivePage(1)
      setRefreshKey((currentKey) => currentKey + 1)
    } catch (error) {
      setCreateErrorMessage(getErrorMessage(error))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Container size="lg" py="xl">
      <Paper withBorder radius="md" p="xl" className="bg-white">
        <Group justify="space-between" align="flex-start" mb="lg">
          <div>
            <Group align="baseline" gap="md">
              <Title order={1}>Clientes</Title>
              {reviewedDebtorsPercentageStatus === 'loading' ? (
                <Text c="dimmed" size="sm">
                  Calculando revisados...
                </Text>
              ) : null}
              {reviewedDebtorsPercentageStatus === 'ok' &&
              reviewedDebtorsPercentage !== null ? (
                <Badge
                  color="blue"
                  h="auto"
                  py={4}
                  styles={{ label: { textTransform: 'none' } }}
                  variant="light"
                >
                  <Text component="span" fw={700} size="md">
                    {percentFormatter.format(reviewedDebtorsPercentage)}%
                  </Text>{' '}
                  de deudores revisados
                </Badge>
              ) : null}
            </Group>
            <Text mt="xs" c="dimmed">
              Deudas registradas por cliente.
            </Text>
          </div>

          <Group gap="md">
            {status === 'ok' ? (
              <Text fw={600}>{numberFormatter.format(total)} clientes</Text>
            ) : null}
            <Button variant="light" onClick={() => setIsCreateModalOpen(true)}>
              Crear
            </Button>
          </Group>
        </Group>

        {status === 'loading' && !hasLoadedCustomers ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : null}

        {status === 'error' ? (
          <Alert color="red" title="Error al cargar clientes">
            {errorMessage}
          </Alert>
        ) : null}

        {status === 'ok' && hasLoadedCustomers && !hasCustomers ? (
          <Center py={64}>
            <Stack align="center" gap="md" maw={420}>
              <ThemeIcon color="blue" radius="xl" size={64} variant="light">
                <IconUsers size={34} />
              </ThemeIcon>
              <Stack align="center" gap={4}>
                <Title order={2} ta="center">
                  No hay clientes para mostrar
                </Title>
                <Text c="dimmed" ta="center">
                  {hasActiveFilters
                    ? 'No encontramos clientes con los filtros actuales.'
                    : 'Todavia no hay clientes cargados en el sistema.'}
                </Text>
              </Stack>
              <Group justify="center">
                {hasActiveFilters ? (
                  <Button variant="default" onClick={handleResetFilters}>
                    Limpiar filtros
                  </Button>
                ) : null}
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Crear cliente
                </Button>
              </Group>
            </Stack>
          </Center>
        ) : null}

        {status !== 'error' && hasLoadedCustomers && hasCustomers ? (
          <Box pos="relative">
            <LoadingOverlay
              visible={status === 'loading'}
              overlayProps={{ blur: 1, radius: 'sm' }}
            />

            <CustomerFilters
              companyName={companyName}
              companyNameInputRef={companyNameInputRef}
              companyType={companyType}
              includeReviewed={includeReviewed}
              onClearCompanyName={handleClearCompanyName}
              onCompanyNameChange={handleCompanyNameChange}
              onCompanyTypeChange={handleCompanyTypeChange}
              onIncludeReviewedChange={handleIncludeReviewedChange}
              onResetFilters={handleResetFilters}
              onSortChange={handleSortChange}
              sortBy={sortBy}
            />

            <CustomersTable
              customers={customers}
              lastVisitedCustomerID={lastVisitedCustomerID}
              search={currentSearch}
            />

            {status === 'ok' && totalPages > 1 ? (
              <Group justify="center" mt="lg">
                <Pagination
                  total={totalPages}
                  value={activePage}
                  onChange={setActivePage}
                />
              </Group>
            ) : null}
          </Box>
        ) : null}

        <CreateCustomerModal
          errorMessage={createErrorMessage}
          form={createForm}
          isSaving={isCreating}
          onChange={handleCreateFormChange}
          onClose={handleCloseCreateModal}
          onSave={handleCreateCustomer}
          opened={isCreateModalOpen}
        />
      </Paper>
    </Container>
  )
}
