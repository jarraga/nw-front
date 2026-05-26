import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Anchor,
  Alert,
  Box,
  Button,
  Center,
  CloseButton,
  Container,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  Pagination,
  Paper,
  Radio,
  ScrollArea,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconEyeCheck } from '@tabler/icons-react'

import { CustomerViewersAvatars } from '../../customer-viewers/CustomerViewersAvatars'
import { useCustomerViewers } from '../../customer-viewers/CustomerViewers'
import { routePaths } from '../../routes/paths'
import { useInformantSession } from '../../session/InformantSession'
import type { AsyncStatus } from '../../types/async-status'
import type {
  CompanyType,
  CustomerDebt,
  CustomerDebtListResponse,
  CustomerDebtSortBy,
} from '../../types/customer'
import { getErrorMessage } from '../../utils/error-message'

const CUSTOMERS_DEBT_LIST_URL = 'http://localhost:8080/customers/debt-list'
const CUSTOMERS_URL = 'http://localhost:8080/customers'
const PAGE_SIZE = 50
const ALL_COMPANY_TYPES = 'all'
const INCLUDE_REVIEWED_STORAGE_KEY = 'includeReviewed'

const companyTypeLabels: Record<CompanyType, string> = {
  enterprise: 'Empresa',
  pyme: 'PyME',
  startup: 'Startup',
}

const numberFormatter = new Intl.NumberFormat('es-AR')
const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})
const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

type CreateCustomerForm = {
  companyName: string
  companyType: CompanyType
  phone: string
  email: string
  monthlyFee: string
  billingStartedAt: string
  comments: string
}

function createEmptyCustomerForm(): CreateCustomerForm {
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

function readStoredIncludeReviewed() {
  const storedIncludeReviewed = localStorage.getItem(INCLUDE_REVIEWED_STORAGE_KEY)

  if (storedIncludeReviewed === null) {
    return true
  }

  return storedIncludeReviewed === 'true'
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function formatNullableDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : '-'
}

function ReviewIndicator({ review }: { review: CustomerDebt['review'] }) {
  if (!review.isReviewed) {
    return null
  }

  return (
    <Tooltip
      withArrow
      label={
        <Stack gap={4}>
          <Text size="sm">Revisado: {formatNullableDateTime(review.reviewedAt)}</Text>
          <Text size="sm">Por: {review.reviewedBy ?? '-'}</Text>
          <Text size="sm">
            No revisar hasta: {formatNullableDateTime(review.reviewedUntil)}
          </Text>
        </Stack>
      }
    >
      <ThemeIcon variant="light" color="green" radius="xl" size="sm">
        <IconEyeCheck size={16} />
      </ThemeIcon>
    </Tooltip>
  )
}

function buildCustomersUrl(
  page: number,
  sortBy: CustomerDebtSortBy,
  companyType: CompanyType | typeof ALL_COMPANY_TYPES,
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

function CustomersTable({ customers }: { customers: CustomerDebt[] }) {
  const { getCustomerViewers } = useCustomerViewers()

  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Empresa</Table.Th>
            <Table.Th>Tipo de empresa</Table.Th>
            <Table.Th>Inicio de facturacion</Table.Th>
            <Table.Th>Abono mensual</Table.Th>
            <Table.Th>Meses vencidos</Table.Th>
            <Table.Th>Monto vencido</Table.Th>
            <Table.Th
              ta="center"
              style={{ width: 96, minWidth: 96, maxWidth: 96 }}
            >
              Revisado
            </Table.Th>
            <Table.Th
              ta="center"
              style={{ width: 104, minWidth: 104, maxWidth: 104 }}
            >
              Viendo
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {customers.map((customer) => {
            const viewers = getCustomerViewers(customer.id)

            return (
              <Table.Tr
                key={customer.id}
                bg={viewers.length > 0 ? 'blue.0' : undefined}
              >
                <Table.Td>
                  <Anchor component={Link} to={routePaths.customerDetail(customer.id)}>
                    {customer.companyName}
                  </Anchor>
                </Table.Td>
                <Table.Td>{companyTypeLabels[customer.companyType]}</Table.Td>
                <Table.Td>{formatDate(customer.billingStartedAt)}</Table.Td>
                <Table.Td>{currencyFormatter.format(customer.monthlyFee)}</Table.Td>
                <Table.Td>{numberFormatter.format(customer.overdueMonths)}</Table.Td>
                <Table.Td>{currencyFormatter.format(customer.overdueAmount)}</Table.Td>
                <Table.Td
                  ta="center"
                  style={{ width: 96, minWidth: 96, maxWidth: 96 }}
                >
                  <Group justify="center">
                    <ReviewIndicator review={customer.review} />
                  </Group>
                </Table.Td>
                <Table.Td
                  ta="center"
                  style={{ width: 104, minWidth: 104, maxWidth: 104 }}
                >
                  <CustomerViewersAvatars
                    justify="center"
                    maxVisible={3}
                    viewers={viewers}
                  />
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  )
}

function CreateCustomerModal({
  errorMessage,
  form,
  isSaving,
  onChange,
  onClose,
  onSave,
  opened,
}: {
  errorMessage: string
  form: CreateCustomerForm
  isSaving: boolean
  onChange: (field: keyof CreateCustomerForm, value: string) => void
  onClose: () => void
  onSave: () => void
  opened: boolean
}) {
  const canSave =
    form.companyName.trim() !== '' &&
    form.monthlyFee.trim() !== '' &&
    form.billingStartedAt.trim() !== ''

  return (
    <Modal opened={opened} onClose={onClose} title="Crear cliente" centered>
      <Stack gap="md">
        <TextInput
          label="Empresa"
          value={form.companyName}
          onChange={(event) =>
            onChange('companyName', event.currentTarget.value)
          }
          required
        />

        <Select
          label="Tipo de empresa"
          value={form.companyType}
          onChange={(value) =>
            onChange('companyType', (value ?? 'enterprise') as CompanyType)
          }
          data={[
            { value: 'enterprise', label: companyTypeLabels.enterprise },
            { value: 'pyme', label: companyTypeLabels.pyme },
            { value: 'startup', label: companyTypeLabels.startup },
          ]}
          allowDeselect={false}
          required
        />

        <TextInput
          label="Telefono"
          value={form.phone}
          onChange={(event) => onChange('phone', event.currentTarget.value)}
        />

        <TextInput
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => onChange('email', event.currentTarget.value)}
        />

        <TextInput
          label="Abono mensual"
          type="number"
          min={0}
          value={form.monthlyFee}
          onChange={(event) =>
            onChange('monthlyFee', event.currentTarget.value)
          }
          required
        />

        <TextInput
          label="Inicio de facturacion"
          type="date"
          value={form.billingStartedAt}
          onChange={(event) =>
            onChange('billingStartedAt', event.currentTarget.value)
          }
          required
        />

        <Textarea
          label="Comentarios"
          rows={4}
          value={form.comments}
          onChange={(event) => onChange('comments', event.currentTarget.value)}
        />

        {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={onSave} loading={isSaving} disabled={!canSave}>
            Crear
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export function CustomersPage() {
  const { dueDay } = useInformantSession()
  const companyNameInputRef = useRef<HTMLInputElement>(null)
  const companyNameDebounceRef = useRef<number | null>(null)
  const [status, setStatus] = useState<AsyncStatus>('loading')
  const [hasLoadedCustomers, setHasLoadedCustomers] = useState(false)
  const [customers, setCustomers] = useState<CustomerDebt[]>([])
  const [total, setTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activePage, setActivePage] = useState(1)
  const [sortBy, setSortBy] = useState<CustomerDebtSortBy>('amount')
  const [companyName, setCompanyName] = useState('')
  const [debouncedCompanyName, setDebouncedCompanyName] = useState('')
  const [companyType, setCompanyType] = useState<
    CompanyType | typeof ALL_COMPANY_TYPES
  >(ALL_COMPANY_TYPES)
  const [includeReviewed, setIncludeReviewed] = useState(
    readStoredIncludeReviewed,
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState(createEmptyCustomerForm)
  const [isCreating, setIsCreating] = useState(false)
  const [createErrorMessage, setCreateErrorMessage] = useState('')
  const totalPages = Math.ceil(total / PAGE_SIZE)

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
    setCompanyType((value ?? ALL_COMPANY_TYPES) as CompanyType | typeof ALL_COMPANY_TYPES)
    setActivePage(1)
  }

  function handleCompanyNameChange(value: string) {
    setCompanyName(value)
    setActivePage(1)
  }

  function handleClearCompanyName() {
    if (companyNameDebounceRef.current !== null) {
      window.clearTimeout(companyNameDebounceRef.current)
      companyNameDebounceRef.current = null
    }

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
            <Title order={1}>Clientes</Title>
            <Text mt="xs" c="dimmed">
              Deudas registradas por cliente.
            </Text>
          </div>

          <Group gap="md">
            {status === 'ok' ? (
              <Text fw={600}>{numberFormatter.format(total)} clientes</Text>
            ) : null}
            <Button
              variant="light"
              onClick={() => setIsCreateModalOpen(true)}
            >
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

        {status !== 'error' && hasLoadedCustomers ? (
          <Box pos="relative">
            <LoadingOverlay
              visible={status === 'loading'}
              overlayProps={{ blur: 1, radius: 'sm' }}
            />

            <Box
              mb="md"
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(180px, 1fr) minmax(280px, 1.6fr) minmax(200px, 1.1fr) minmax(140px, 0.8fr)',
                width: '100%',
              }}
            >
              <Box pr="md">
                <TextInput
                  ref={companyNameInputRef}
                  label="Buscar empresa"
                  value={companyName}
                  onChange={(event) =>
                    handleCompanyNameChange(event.currentTarget.value)
                  }
                  rightSection={
                    companyName ? (
                      <CloseButton
                        aria-label="Borrar busqueda"
                        onClick={handleClearCompanyName}
                        onMouseDown={(event) => event.preventDefault()}
                        size="sm"
                      />
                    ) : null
                  }
                />
              </Box>

              <Box px="md" style={{ borderLeft: '1px solid var(--mantine-color-gray-3)' }}>
                <Radio.Group
                  label="Ordenar por"
                  value={sortBy}
                  onChange={handleSortChange}
                >
                  <Group mt={8} wrap="nowrap">
                    <Radio value="amount" label="Monto vencido" />
                    <Radio value="months" label="Meses vencidos" />
                  </Group>
                </Radio.Group>
              </Box>

              <Box px="md" style={{ borderLeft: '1px solid var(--mantine-color-gray-3)' }}>
                <Select
                  label="Tipo de empresa"
                  value={companyType}
                  onChange={handleCompanyTypeChange}
                  data={[
                    { value: ALL_COMPANY_TYPES, label: 'Todos' },
                    { value: 'enterprise', label: companyTypeLabels.enterprise },
                    { value: 'pyme', label: companyTypeLabels.pyme },
                    { value: 'startup', label: companyTypeLabels.startup },
                  ]}
                  allowDeselect={false}
                />
              </Box>

              <Box
                pl="md"
                style={{
                  alignItems: 'flex-start',
                  flexDirection: 'column',
                  borderLeft: '1px solid var(--mantine-color-gray-3)',
                  display: 'flex',
                  minHeight: 60,
                }}
              >
                <Text
                  component="label"
                  fw={500}
                  mb={12}
                  size="sm"
                >
                  Revisados
                </Text>
                <Switch
                  label="Mostrar"
                  checked={includeReviewed}
                  onChange={(event) =>
                    handleIncludeReviewedChange(event.currentTarget.checked)
                  }
                />
              </Box>
            </Box>

            {customers.length > 0 ? (
              <CustomersTable customers={customers} />
            ) : null}

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
