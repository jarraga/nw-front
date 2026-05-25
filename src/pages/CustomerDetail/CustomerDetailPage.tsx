import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconBriefcase,
  IconCalendarDollar,
  IconMail,
  IconMapPin,
  IconMessageCircle,
  IconPhone,
} from '@tabler/icons-react'

import { routePaths } from '../../routes/paths'
import type { AsyncStatus } from '../../types/async-status'
import type {
  CompanyType,
  CustomerAction,
  CustomerActionType,
  CustomerDetailResponse,
  CustomerPayment,
} from '../../types/customer'

const CUSTOMERS_URL = 'http://localhost:8080/customers'
const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth() + 1

const companyTypeLabels: Record<CompanyType, string> = {
  enterprise: 'Empresa',
  pyme: 'PyME',
  startup: 'Startup',
}

const actionTypeLabels: Record<CustomerActionType, string> = {
  call: 'Llamada',
  email: 'Email',
  personal_visit: 'Visita personal',
  other: 'Otra accion',
}

const monthLabels = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

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

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : '-'
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

function getActionIcon(type: CustomerActionType) {
  if (type === 'call') return IconPhone
  if (type === 'email') return IconMail
  if (type === 'personal_visit') return IconMapPin

  return IconMessageCircle
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fw={600}>{value}</Text>
    </div>
  )
}

function ActionsSection({ actions }: { actions: CustomerAction[] }) {
  const sortedActions = [...actions].sort(
    (a, b) =>
      new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime(),
  )

  return (
    <Stack gap="md">
      <Title order={2}>Acciones</Title>

      {sortedActions.length === 0 ? (
        <Text c="dimmed">Sin acciones registradas.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          {sortedActions.map((action) => {
            const ActionIcon = getActionIcon(action.type)

            return (
              <Card key={action.id} withBorder radius="md" p="md">
                <Group align="flex-start" gap="md">
                  <ThemeIcon variant="light" size="lg" radius="md">
                    <ActionIcon size={20} />
                  </ThemeIcon>

                  <Stack gap={4}>
                    <Group gap="xs">
                      <Text fw={700}>{actionTypeLabels[action.type]}</Text>
                      <Badge variant="light">{formatDateTime(action.actionDate)}</Badge>
                    </Group>
                    <Text c={action.comments ? undefined : 'dimmed'}>
                      {action.comments || 'Sin comentarios.'}
                    </Text>
                  </Stack>
                </Group>
              </Card>
            )
          })}
        </SimpleGrid>
      )}
    </Stack>
  )
}

function groupPaymentsByYear(payments: CustomerPayment[]) {
  return payments.reduce<Record<number, CustomerPayment[]>>((acc, payment) => {
    acc[payment.year] = [...(acc[payment.year] ?? []), payment]
    return acc
  }, {})
}

function buildPaymentRows(year: number, payments: CustomerPayment[]) {
  if (year !== currentYear) {
    return [...payments]
      .sort((a, b) => a.month - b.month)
      .map((payment) => ({
        month: payment.month,
        payment,
      }))
  }

  return Array.from({ length: currentMonth }, (_, index) => {
    const month = index + 1
    return {
      month,
      payment: payments.find((payment) => payment.month === month),
    }
  })
}

function PaymentsSection({ payments }: { payments: CustomerPayment[] }) {
  const paymentsByYear = useMemo(() => groupPaymentsByYear(payments), [payments])
  const years = Array.from(
    new Set([...Object.keys(paymentsByYear).map(Number), currentYear]),
  ).sort((a, b) => b - a)

  return (
    <Stack gap="md">
      <Title order={2}>Pagos</Title>

      {years.length === 0 ? (
        <Text c="dimmed">Sin pagos registrados.</Text>
      ) : (
        years.map((year) => (
          <Stack key={year} gap="xs">
            <Title order={3}>{year}</Title>
            <Table striped withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Mes</Table.Th>
                  <Table.Th>Fecha de pago</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {buildPaymentRows(year, paymentsByYear[year] ?? []).map(
                  ({ month, payment }) => (
                    <Table.Tr key={payment?.id ?? `${year}-${month}`}>
                      <Table.Td>{monthLabels[month - 1]}</Table.Td>
                      <Table.Td>
                        {payment?.paidAt ? (
                          formatDate(payment.paidAt)
                        ) : (
                          <Button size="xs" variant="light">
                            Registrar pago
                          </Button>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ),
                )}
              </Table.Tbody>
            </Table>
          </Stack>
        ))
      )}
    </Stack>
  )
}

export function CustomerDetailPage() {
  const { customerId } = useParams()
  const [status, setStatus] = useState<AsyncStatus>('loading')
  const [data, setData] = useState<CustomerDetailResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function fetchCustomer() {
      if (!customerId) {
        setStatus('error')
        setErrorMessage('No se encontro el cliente solicitado.')
        return
      }

      try {
        setStatus('loading')
        setErrorMessage('')

        const response = await fetch(`${CUSTOMERS_URL}/${customerId}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('No se pudo obtener el detalle del cliente.')
        }

        const customerDetail = (await response.json()) as CustomerDetailResponse
        setData(customerDetail)
        setStatus('ok')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Ocurrio un error inesperado.',
        )
        setStatus('error')
      }
    }

    void fetchCustomer()

    return () => controller.abort()
  }, [customerId])

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Anchor component={Link} to={routePaths.customers}>
          Volver a clientes
        </Anchor>

        {status === 'loading' ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : null}

        {status === 'error' ? (
          <Alert color="red" title="Error al cargar cliente">
            {errorMessage}
          </Alert>
        ) : null}

        {status === 'ok' && data ? (
          <Paper withBorder radius="md" p="xl" className="bg-white">
            <Stack gap="xl">
              <div>
                <Title order={1}>{data.customer.companyName}</Title>
                <Text mt="xs" c="dimmed">
                  Detalle del cliente.
                </Text>
              </div>

              <Stack gap="md">
                <Title order={2}>Info</Title>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                  <InfoItem
                    label="Tipo de empresa"
                    value={companyTypeLabels[data.customer.companyType]}
                  />
                  <InfoItem label="Telefono" value={data.customer.phone} />
                  <InfoItem label="Email" value={data.customer.email} />
                  <InfoItem
                    label="Abono mensual"
                    value={currencyFormatter.format(data.customer.monthlyFee)}
                  />
                  <InfoItem
                    label="Inicio de facturacion"
                    value={formatDate(data.customer.billingStartedAt)}
                  />
                  <InfoItem
                    label="Fecha de alta"
                    value={formatDateTime(data.customer.createdAt)}
                  />
                </SimpleGrid>
              </Stack>

              <Divider />

              <Stack gap="xs">
                <Group gap="xs">
                  <ThemeIcon variant="light" radius="md">
                    <IconBriefcase size={18} />
                  </ThemeIcon>
                  <Title order={2}>Comentarios</Title>
                </Group>
                <Text c={data.customer.comments ? undefined : 'dimmed'}>
                  {data.customer.comments || 'Sin comentarios.'}
                </Text>
              </Stack>

              <Divider />

              <ActionsSection actions={data.actions} />

              <Divider />

              <Group gap="xs">
                <ThemeIcon variant="light" radius="md">
                  <IconCalendarDollar size={18} />
                </ThemeIcon>
                <PaymentsSection payments={data.payments} />
              </Group>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </Container>
  )
}
