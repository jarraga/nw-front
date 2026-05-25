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
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { QRCodeSVG } from 'qrcode.react'
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

type ContactModalData = {
  label: string
  actionLabel: string
  value: string
  href: string
}

type ActionTypeOption = {
  value: CustomerActionType
  label: string
  icon: typeof IconPhone
}

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

const actionTypeOptions: ActionTypeOption[] = [
  { value: 'call', label: actionTypeLabels.call, icon: IconPhone },
  { value: 'email', label: actionTypeLabels.email, icon: IconMail },
  {
    value: 'personal_visit',
    label: actionTypeLabels.personal_visit,
    icon: IconMapPin,
  },
  { value: 'other', label: actionTypeLabels.other, icon: IconMessageCircle },
]

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

function ContactInfoItem({
  label,
  actionLabel,
  value,
  href,
  onOpen,
}: ContactModalData & { onOpen: (contact: ContactModalData) => void }) {
  return (
    <div>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Button
        variant="subtle"
        size="compact-sm"
        px={0}
        onClick={() => onOpen({ label, actionLabel, value, href })}
      >
        {value}
      </Button>
    </div>
  )
}

function ContactModal({
  contact,
  onClose,
}: {
  contact: ContactModalData | null
  onClose: () => void
}) {
  return (
    <Modal
      opened={contact !== null}
      onClose={onClose}
      title={contact?.label}
      centered
    >
      {contact ? (
        <Stack align="center" gap="md">
          <Text fw={700} size="lg">
            {contact.value}
          </Text>

          <Anchor href={contact.href}>{contact.actionLabel}</Anchor>

          <Paper withBorder p="md" radius="md">
            <QRCodeSVG value={contact.href} size={220} />
          </Paper>
        </Stack>
      ) : null}
    </Modal>
  )
}

function AddActionModal({
  customerId,
  opened,
  onClose,
  onSaved,
}: {
  customerId: number
  opened: boolean
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [type, setType] = useState<CustomerActionType>('personal_visit')
  const [comments, setComments] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSave() {
    try {
      setIsSaving(true)
      setErrorMessage('')

      const response = await fetch(`${CUSTOMERS_URL}/${customerId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          comments,
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo agregar la accion.')
      }

      await onSaved()
      setType('personal_visit')
      setComments('')
      onClose()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Ocurrio un error inesperado.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setErrorMessage('')
    onClose()
  }

  return (
    <Modal opened={opened} onClose={handleCancel} title="Agregar acción" centered>
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Tipo
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {actionTypeOptions.map((option) => {
              const OptionIcon = option.icon
              const isSelected = option.value === type

              return (
                <Button
                  key={option.value}
                  variant={isSelected ? 'filled' : 'light'}
                  justify="flex-start"
                  leftSection={<OptionIcon size={18} />}
                  onClick={() => setType(option.value)}
                >
                  {option.label}
                </Button>
              )
            })}
          </SimpleGrid>
        </div>

        <Textarea
          label="Comentarios"
          rows={5}
          value={comments}
          onChange={(event) => setComments(event.currentTarget.value)}
        />

        {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={handleCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            Guardar
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

function EditCommentsModal({
  customerId,
  initialComments,
  opened,
  onClose,
  onSaved,
}: {
  customerId: number
  initialComments: string
  opened: boolean
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [comments, setComments] = useState(initialComments)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (opened) {
      setComments(initialComments)
      setErrorMessage('')
    }
  }, [initialComments, opened])

  async function handleSave() {
    try {
      setIsSaving(true)
      setErrorMessage('')

      const response = await fetch(`${CUSTOMERS_URL}/${customerId}/comments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comments,
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudieron actualizar los comentarios.')
      }

      await onSaved()
      onClose()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Ocurrio un error inesperado.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setErrorMessage('')
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleCancel}
      title="Editar comentarios"
      centered
    >
      <Stack gap="md">
        <Textarea
          label="Comentarios"
          rows={5}
          value={comments}
          onChange={(event) => setComments(event.currentTarget.value)}
        />

        {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={handleCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            Guardar
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

function ActionsSection({
  actions,
  onAddAction,
}: {
  actions: CustomerAction[]
  onAddAction: () => void
}) {
  const sortedActions = [...actions].sort(
    (a, b) =>
      new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime(),
  )

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Acciones</Title>
        <Button onClick={onAddAction}>Agregar acción</Button>
      </Group>

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
  const [contactModal, setContactModal] = useState<ContactModalData | null>(
    null,
  )
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false)

  async function fetchCustomerDetail(signal?: AbortSignal) {
    if (!customerId) {
      setStatus('error')
      setErrorMessage('No se encontro el cliente solicitado.')
      return
    }

    const response = await fetch(`${CUSTOMERS_URL}/${customerId}`, {
      signal,
    })

    if (!response.ok) {
      throw new Error('No se pudo obtener el detalle del cliente.')
    }

    const customerDetail = (await response.json()) as CustomerDetailResponse
    setData(customerDetail)
    setStatus('ok')
  }

  async function refreshCustomerDetail() {
    await fetchCustomerDetail()
  }

  useEffect(() => {
    const controller = new AbortController()

    async function fetchCustomer() {
      try {
        setStatus('loading')
        setErrorMessage('')
        await fetchCustomerDetail(controller.signal)
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
                  <ContactInfoItem
                    label="Telefono"
                    actionLabel="Llamar"
                    value={data.customer.phone}
                    href={`tel:${data.customer.phone}`}
                    onOpen={setContactModal}
                  />
                  <ContactInfoItem
                    label="Email"
                    actionLabel="Enviar email"
                    value={data.customer.email}
                    href={`mailto:${data.customer.email}`}
                    onOpen={setContactModal}
                  />
                  <InfoItem
                    label="Abono mensual"
                    value={currencyFormatter.format(data.customer.monthlyFee)}
                  />
                  <InfoItem
                    label="Inicio de facturacion"
                    value={formatDate(data.customer.billingStartedAt)}
                  />
                </SimpleGrid>
              </Stack>

              <Divider />

              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <ThemeIcon variant="light" radius="md">
                      <IconBriefcase size={18} />
                    </ThemeIcon>
                    <Title order={2}>Comentarios</Title>
                  </Group>
                  <Button
                    variant="light"
                    onClick={() => setIsCommentsModalOpen(true)}
                  >
                    Editar
                  </Button>
                </Group>
                <Text c={data.customer.comments ? undefined : 'dimmed'}>
                  {data.customer.comments || 'Sin comentarios.'}
                </Text>
              </Stack>

              <Divider />

              <ActionsSection
                actions={data.actions}
                onAddAction={() => setIsActionModalOpen(true)}
              />

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

        <ContactModal
          contact={contactModal}
          onClose={() => setContactModal(null)}
        />

        {data ? (
          <AddActionModal
            customerId={data.customer.id}
            opened={isActionModalOpen}
            onClose={() => setIsActionModalOpen(false)}
            onSaved={refreshCustomerDetail}
          />
        ) : null}

        {data ? (
          <EditCommentsModal
            customerId={data.customer.id}
            initialComments={data.customer.comments}
            opened={isCommentsModalOpen}
            onClose={() => setIsCommentsModalOpen(false)}
            onSaved={refreshCustomerDetail}
          />
        ) : null}
      </Stack>
    </Container>
  )
}
