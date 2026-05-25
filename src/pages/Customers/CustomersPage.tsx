import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Anchor,
  Alert,
  Center,
  Container,
  Group,
  Loader,
  Pagination,
  Paper,
  Radio,
  ScrollArea,
  Select,
  Table,
  Text,
  Title,
} from '@mantine/core'

import { CustomerViewersAvatars } from '../../customer-viewers/CustomerViewersAvatars'
import { useCustomerViewers } from '../../customer-viewers/CustomerViewers'
import { routePaths } from '../../routes/paths'
import type { AsyncStatus } from '../../types/async-status'
import type {
  CompanyType,
  CustomerDebt,
  CustomerDebtListResponse,
  CustomerDebtSortBy,
} from '../../types/customer'
import { getErrorMessage } from '../../utils/error-message'

const CUSTOMERS_DEBT_LIST_URL = 'http://localhost:8080/customers/debt-list'
const PAGE_SIZE = 50
const ALL_COMPANY_TYPES = 'all'

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

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function buildCustomersUrl(
  page: number,
  sortBy: CustomerDebtSortBy,
  companyType: CompanyType | typeof ALL_COMPANY_TYPES,
) {
  const offset = (page - 1) * PAGE_SIZE
  const url = new URL(CUSTOMERS_DEBT_LIST_URL)
  url.searchParams.set('limit', PAGE_SIZE.toString())
  url.searchParams.set('offset', offset.toString())
  url.searchParams.set('sortBy', sortBy)

  if (companyType !== ALL_COMPANY_TYPES) {
    url.searchParams.set('companyType', companyType)
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
            <Table.Th ta="center">Viendo</Table.Th>
            <Table.Th>Tipo de empresa</Table.Th>
            <Table.Th>Telefono</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Abono mensual</Table.Th>
            <Table.Th>Inicio de facturacion</Table.Th>
            <Table.Th>Meses vencidos</Table.Th>
            <Table.Th>Monto vencido</Table.Th>
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
                <Table.Td ta="center">
                  <CustomerViewersAvatars justify="center" viewers={viewers} />
                </Table.Td>
                <Table.Td>{companyTypeLabels[customer.companyType]}</Table.Td>
                <Table.Td>{customer.phone}</Table.Td>
                <Table.Td>{customer.email}</Table.Td>
                <Table.Td>{currencyFormatter.format(customer.monthlyFee)}</Table.Td>
                <Table.Td>{formatDate(customer.billingStartedAt)}</Table.Td>
                <Table.Td>{numberFormatter.format(customer.overdueMonths)}</Table.Td>
                <Table.Td>{currencyFormatter.format(customer.overdueAmount)}</Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  )
}

export function CustomersPage() {
  const [status, setStatus] = useState<AsyncStatus>('loading')
  const [customers, setCustomers] = useState<CustomerDebt[]>([])
  const [total, setTotal] = useState(0)
  const [activePage, setActivePage] = useState(1)
  const [sortBy, setSortBy] = useState<CustomerDebtSortBy>('amount')
  const [companyType, setCompanyType] = useState<
    CompanyType | typeof ALL_COMPANY_TYPES
  >(ALL_COMPANY_TYPES)
  const [errorMessage, setErrorMessage] = useState('')
  const totalPages = Math.ceil(total / PAGE_SIZE)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchCustomers() {
      try {
        setStatus('loading')
        setErrorMessage('')

        const response = await fetch(
          buildCustomersUrl(activePage, sortBy, companyType),
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
  }, [activePage, sortBy, companyType])

  function handleSortChange(value: string) {
    setSortBy(value as CustomerDebtSortBy)
    setActivePage(1)
  }

  function handleCompanyTypeChange(value: string | null) {
    setCompanyType((value ?? ALL_COMPANY_TYPES) as CompanyType | typeof ALL_COMPANY_TYPES)
    setActivePage(1)
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

          {status === 'ok' ? (
            <Text fw={600}>{numberFormatter.format(total)} clientes</Text>
          ) : null}
        </Group>

        {status === 'loading' ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : null}

        {status === 'error' ? (
          <Alert color="red" title="Error al cargar clientes">
            {errorMessage}
          </Alert>
        ) : null}

        {status === 'ok' ? (
          <>
            <Group align="flex-end" mb="md">
              <Radio.Group
                label="Ordenar por"
                value={sortBy}
                onChange={handleSortChange}
              >
                <Group mt="xs">
                  <Radio value="amount" label="Monto vencido" />
                  <Radio value="months" label="Meses vencidos" />
                </Group>
              </Radio.Group>

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
            </Group>

            <CustomersTable customers={customers} />

            {totalPages > 1 ? (
              <Group justify="center" mt="lg">
                <Pagination
                  total={totalPages}
                  value={activePage}
                  onChange={setActivePage}
                />
              </Group>
            ) : null}
          </>
        ) : null}
      </Paper>
    </Container>
  )
}
