import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Alert,
  Anchor,
  ActionIcon as MantineActionIcon,
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
  Tabs,
  Table,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { QRCodeSVG } from 'qrcode.react'
import {
  IconCalendarDollar,
  IconCash,
  IconDots,
  IconInfoCircle,
  IconMail,
  IconMapPin,
  IconNotes,
  IconPencil,
  IconPhone,
  IconTrash,
} from '@tabler/icons-react'

import { CustomerViewersAvatars } from '../../customer-viewers/CustomerViewersAvatars'
import { useCustomerViewers } from '../../customer-viewers/CustomerViewers'
import { routePaths } from '../../routes/paths'
import { useInformantSession } from '../../session/InformantSession'
import type { AsyncStatus } from '../../types/async-status'
import type {
  CompanyType,
  CustomerAction,
  CustomerActionType,
  CustomerDetailResponse,
  CustomerPayment,
} from '../../types/customer'
import { getErrorMessage } from '../../utils/error-message'

const CUSTOMERS_URL = 'http://localhost:8080/customers'
const currentDate = new Date()
const currentYear = currentDate.getFullYear()

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
  { value: 'other', label: actionTypeLabels.other, icon: IconDots },
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
const numberFormatter = new Intl.NumberFormat('es-AR')
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

  return IconDots
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

function DebtInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fw={700} size="xl">
        {value}
      </Text>
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

function EditCustomerModal({
  customer,
  opened,
  onClose,
  onSaved,
}: {
  customer: CustomerDetailResponse['customer'] | null
  opened: boolean
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (opened && customer) {
      setPhone(customer.phone)
      setEmail(customer.email)
      setMonthlyFee(customer.monthlyFee.toString())
      setErrorMessage('')
    }
  }, [customer, opened])

  async function handleSave() {
    if (!customer) {
      return
    }

    const parsedMonthlyFee = Number(monthlyFee)

    if (!Number.isFinite(parsedMonthlyFee)) {
      setErrorMessage('El abono mensual no es valido.')
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')

      const response = await fetch(`${CUSTOMERS_URL}/${customer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          email,
          monthlyFee: parsedMonthlyFee,
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo actualizar el cliente.')
      }

      await onSaved()
      onClose()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setErrorMessage('')
    onClose()
  }

  return (
    <Modal opened={opened} onClose={handleCancel} title="Editar cliente" centered>
      <Stack gap="md">
        <TextInput
          label="Telefono"
          value={phone}
          onChange={(event) => setPhone(event.currentTarget.value)}
        />

        <TextInput
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />

        <TextInput
          label="Abono mensual"
          type="number"
          min={0}
          value={monthlyFee}
          onChange={(event) => setMonthlyFee(event.currentTarget.value)}
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

function AddActionModal({
  customerId,
  informantName,
  opened,
  onClose,
  onSaved,
}: {
  customerId: number
  informantName: string
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
          informantName,
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
      setErrorMessage(getErrorMessage(error))
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
      setErrorMessage(getErrorMessage(error))
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

function EditActionCommentsModal({
  customerId,
  action,
  onClose,
  onSaved,
}: {
  customerId: number
  action: CustomerAction | null
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [comments, setComments] = useState(action?.comments ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (action) {
      setComments(action.comments)
      setErrorMessage('')
    }
  }, [action])

  async function handleSave() {
    if (!action) {
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')

      const response = await fetch(
        `${CUSTOMERS_URL}/${customerId}/actions/${action.id}/comments`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comments,
          }),
        },
      )

      if (!response.ok) {
        throw new Error('No se pudo actualizar el comentario de la accion.')
      }

      await onSaved()
      onClose()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
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
      opened={action !== null}
      onClose={handleCancel}
      title="Editar comentario de accion"
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

function DeleteActionModal({
  customerId,
  action,
  onClose,
  onDeleted,
}: {
  customerId: number
  action: CustomerAction | null
  onClose: () => void
  onDeleted: () => Promise<void>
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (action) {
      setErrorMessage('')
    }
  }, [action])

  async function handleDelete() {
    if (!action) {
      return
    }

    try {
      setIsDeleting(true)
      setErrorMessage('')

      const response = await fetch(
        `${CUSTOMERS_URL}/${customerId}/actions/${action.id}`,
        {
          method: 'DELETE',
        },
      )

      if (!response.ok) {
        throw new Error('No se pudo eliminar la accion.')
      }

      await onDeleted()
      onClose()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  function handleCancel() {
    setErrorMessage('')
    onClose()
  }

  return (
    <Modal
      opened={action !== null}
      onClose={handleCancel}
      title="Eliminar accion"
      centered
    >
      <Stack gap="md">
        <Text>¿Seguro que queres eliminar esta accion?</Text>

        {action?.comments ? (
          <Text c="dimmed" lineClamp={3}>
            {action.comments}
          </Text>
        ) : null}

        {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={handleCancel} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button color="red" onClick={handleDelete} loading={isDeleting}>
            Eliminar
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

function ActionsSection({
  actions,
  onAddAction,
  onEditAction,
  onDeleteAction,
}: {
  actions: CustomerAction[]
  onAddAction: () => void
  onEditAction: (action: CustomerAction) => void
  onDeleteAction: (action: CustomerAction) => void
}) {
  const [showAllActions, setShowAllActions] = useState(false)
  const sortedActions = [...actions].sort(
    (a, b) =>
      new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime(),
  )
  const visibleActions = showAllActions ? sortedActions : sortedActions.slice(0, 3)
  const hasHiddenActions = sortedActions.length > 3

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Acciones</Title>
        <Button onClick={onAddAction}>Agregar acción</Button>
      </Group>

      {sortedActions.length === 0 ? (
        <Text c="dimmed">Sin acciones registradas.</Text>
      ) : (
        <Stack gap="md">
          {visibleActions.map((action) => {
            const ActionTypeIcon = getActionIcon(action.type)

            return (
              <Card
                key={action.id}
                withBorder
                radius="md"
                p="lg"
                pr="5.5rem"
                style={{ position: 'relative' }}
              >
                <MantineActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label="Eliminar accion"
                  style={{
                    position: 'absolute',
                    right: 48,
                    top: 12,
                    zIndex: 1,
                  }}
                  onClick={() => onDeleteAction(action)}
                >
                  <IconTrash size={18} />
                </MantineActionIcon>
                <MantineActionIcon
                  variant="subtle"
                  aria-label="Editar comentario"
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    zIndex: 1,
                  }}
                  onClick={() => onEditAction(action)}
                >
                  <IconPencil size={18} />
                </MantineActionIcon>

                <Stack gap="md">
                  <Group align="center" gap="md" wrap="nowrap">
                    <ThemeIcon variant="light" size="lg" radius="md">
                      <ActionTypeIcon size={20} />
                    </ThemeIcon>

                    <Group gap="xs" wrap="wrap">
                      <Text fw={700}>{actionTypeLabels[action.type]}</Text>
                      <Badge variant="light">
                        {formatDateTime(action.actionDate)}
                      </Badge>
                      {action.informantName ? (
                        <Text size="sm" c="dimmed">
                          {action.informantName}
                        </Text>
                      ) : null}
                    </Group>
                  </Group>

                  <Text c={action.comments ? undefined : 'dimmed'} lh={1.6}>
                    {action.comments || 'Sin comentarios.'}
                  </Text>
                </Stack>
              </Card>
            )
          })}

          {hasHiddenActions ? (
            <Group justify="center">
              <Button
                variant="subtle"
                onClick={() => setShowAllActions((current) => !current)}
              >
                {showAllActions ? 'Mostrar menos' : 'Mostrar más'}
              </Button>
            </Group>
          ) : null}
        </Stack>
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

function parseDateParts(value: string) {
  const [year, month, day] = value.split('-').map(Number)

  return { day, month, year }
}

function getMonthDays(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function buildDate(year: number, month: number, day: number) {
  return new Date(year, month - 1, Math.min(day, getMonthDays(year, month)))
}

function getNextMonth(year: number, month: number) {
  if (month === 12) {
    return { month: 1, year: year + 1 }
  }

  return { month: month + 1, year }
}

function getFirstDueDate(billingStartedAt: string, dueDay: number) {
  const billingStart = parseDateParts(billingStartedAt)

  if (billingStart.day <= dueDay) {
    return buildDate(billingStart.year, billingStart.month, dueDay)
  }

  const nextMonth = getNextMonth(billingStart.year, billingStart.month)

  return buildDate(nextMonth.year, nextMonth.month, dueDay)
}

function getDueMonthsForYear(
  year: number,
  billingStartedAt: string,
  dueDay: number,
) {
  const firstDueDate = getFirstDueDate(billingStartedAt, dueDay)

  return Array.from({ length: 12 }, (_, index) => index + 1).filter((month) => {
    const dueDate = buildDate(year, month, dueDay)

    return dueDate >= firstDueDate && dueDate <= currentDate
  })
}

function getPaymentYears(
  paymentsByYear: Record<number, CustomerPayment[]>,
  billingStartedAt: string,
  dueDay: number,
) {
  const firstDueDate = getFirstDueDate(billingStartedAt, dueDay)
  const paymentYears = Object.keys(paymentsByYear).map(Number)
  const dueYears =
    firstDueDate <= currentDate
      ? Array.from(
          { length: currentYear - firstDueDate.getFullYear() + 1 },
          (_, index) => firstDueDate.getFullYear() + index,
        )
      : []

  return Array.from(new Set([...paymentYears, ...dueYears])).sort(
    (a, b) => a - b,
  )
}

function buildPaymentRows(
  year: number,
  payments: CustomerPayment[],
  billingStartedAt: string,
  dueDay: number,
) {
  const dueMonths = getDueMonthsForYear(year, billingStartedAt, dueDay)
  const paymentMonths = payments.map((payment) => payment.month)

  return Array.from(new Set([...dueMonths, ...paymentMonths]))
    .sort((a, b) => a - b)
    .map((month) => ({
      month,
      payment: payments.find((payment) => payment.month === month),
    }))
}

function PaymentsSection({
  billingStartedAt,
  dueDay,
  payments,
}: {
  billingStartedAt: string
  dueDay: number
  payments: CustomerPayment[]
}) {
  const paymentsByYear = useMemo(() => groupPaymentsByYear(payments), [payments])
  const years = useMemo(
    () => getPaymentYears(paymentsByYear, billingStartedAt, dueDay),
    [billingStartedAt, dueDay, paymentsByYear],
  )
  const defaultYear = years.at(-1)?.toString()

  return (
    <Stack gap="md">
      <Group gap="xs">
        <ThemeIcon variant="light" radius="md">
          <IconCalendarDollar size={18} />
        </ThemeIcon>
        <Title order={2}>Pagos</Title>
      </Group>

      {years.length === 0 ? (
        <Text c="dimmed">Sin pagos registrados.</Text>
      ) : (
        <Tabs defaultValue={defaultYear}>
          <Tabs.List>
            {years.map((year) => (
              <Tabs.Tab key={year} value={year.toString()}>
                {year}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {years.map((year) => {
            const paymentRows = buildPaymentRows(
              year,
              paymentsByYear[year] ?? [],
              billingStartedAt,
              dueDay,
            )

            return (
              <Tabs.Panel key={year} value={year.toString()} pt="md">
                {paymentRows.length === 0 ? (
                  <Text c="dimmed">Sin pagos registrados.</Text>
                ) : (
                  <Table
                    striped
                    withTableBorder
                    withColumnBorders
                    className="table-fixed"
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th className="w-1/2">Mes</Table.Th>
                        <Table.Th className="w-1/2">Fecha de pago</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paymentRows.map(({ month, payment }) => (
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
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Tabs.Panel>
            )
          })}
        </Tabs>
      )}
    </Stack>
  )
}

export function CustomerDetailPage() {
  const { customerId } = useParams()
  const { informantName } = useInformantSession()
  const { getCustomerViewers, notifyCustomerLeave, notifyCustomerView } =
    useCustomerViewers()
  const [status, setStatus] = useState<AsyncStatus>('loading')
  const [data, setData] = useState<CustomerDetailResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [contactModal, setContactModal] = useState<ContactModalData | null>(
    null,
  )
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<CustomerAction | null>(
    null,
  )
  const [deletingAction, setDeletingAction] = useState<CustomerAction | null>(
    null,
  )

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

        setErrorMessage(getErrorMessage(error))
        setStatus('error')
      }
    }

    void fetchCustomer()

    return () => controller.abort()
  }, [customerId])

  useEffect(() => {
    const parsedCustomerID = customerId ? Number(customerId) : NaN

    if (Number.isFinite(parsedCustomerID)) {
      notifyCustomerView(parsedCustomerID)
    }

    return () => {
      notifyCustomerLeave()
    }
  }, [customerId, notifyCustomerLeave, notifyCustomerView])

  const currentCustomerViewers = data
    ? getCustomerViewers(data.customer.id)
    : []

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
              <Group justify="space-between" align="flex-start">
                <div>
                  <Group align="center" gap="sm">
                    <Title order={1}>{data.customer.companyName}</Title>
                    <CustomerViewersAvatars viewers={currentCustomerViewers} />
                  </Group>
                  <Text mt="xs" c="dimmed">
                    Detalle del cliente.
                  </Text>
                </div>

                <Button
                  variant="light"
                  onClick={() => setIsEditCustomerModalOpen(true)}
                >
                  Editar
                </Button>
              </Group>

              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon variant="light" radius="md">
                    <IconInfoCircle size={18} />
                  </ThemeIcon>
                  <Title order={2}>Info</Title>
                </Group>
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

              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon variant="light" radius="md">
                    <IconCash size={18} />
                  </ThemeIcon>
                  <Title order={2}>Deuda actual</Title>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                  <DebtInfoItem
                    label="Dia de vencimiento"
                    value={numberFormatter.format(data.debt.dueDay)}
                  />
                  <DebtInfoItem
                    label="Meses vencidos"
                    value={numberFormatter.format(data.debt.overdueMonths)}
                  />
                  <DebtInfoItem
                    label="Monto vencido"
                    value={currencyFormatter.format(data.debt.overdueAmount)}
                  />
                </SimpleGrid>
              </Stack>

              <Divider />

              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <ThemeIcon variant="light" radius="md">
                      <IconNotes size={18} />
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
                onEditAction={setEditingAction}
                onDeleteAction={setDeletingAction}
              />

              <Divider />

              <PaymentsSection
                billingStartedAt={data.customer.billingStartedAt}
                dueDay={data.debt.dueDay}
                payments={data.payments}
              />
            </Stack>
          </Paper>
        ) : null}

        <ContactModal
          contact={contactModal}
          onClose={() => setContactModal(null)}
        />

        {data ? (
          <EditCustomerModal
            customer={data.customer}
            opened={isEditCustomerModalOpen}
            onClose={() => setIsEditCustomerModalOpen(false)}
            onSaved={refreshCustomerDetail}
          />
        ) : null}

        {data ? (
          <AddActionModal
            customerId={data.customer.id}
            informantName={informantName}
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

        {data ? (
          <EditActionCommentsModal
            customerId={data.customer.id}
            action={editingAction}
            onClose={() => setEditingAction(null)}
            onSaved={refreshCustomerDetail}
          />
        ) : null}

        {data ? (
          <DeleteActionModal
            customerId={data.customer.id}
            action={deletingAction}
            onClose={() => setDeletingAction(null)}
            onDeleted={refreshCustomerDetail}
          />
        ) : null}
      </Stack>
    </Container>
  )
}
