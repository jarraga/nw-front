import { type ReactNode, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
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
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { QRCodeSVG } from 'qrcode.react'
import {
  IconAlertTriangle,
  IconCash,
  IconDots,
  IconInfoSquareRounded,
  IconInfoCircle,
  IconMail,
  IconMapPin,
  IconNotes,
  IconPencil,
  IconPhone,
  IconTimelineEvent,
  IconTrash,
} from '@tabler/icons-react'

import { CustomerViewersAvatars } from '../../customer-viewers/CustomerViewersAvatars'
import { useCustomerViewers } from '../../customer-viewers/CustomerViewers'
import { CUSTOMERS_URL } from '../../config/api'
import { routePaths } from '../../routes/paths'
import { useInformantSession } from '../../session/InformantSession'
import type { AsyncStatus } from '../../types/async-status'
import type {
  CompanyType,
  CustomerAction,
  CustomerActionType,
  CustomerBehavior,
  CustomerDetailResponse,
} from '../../types/customer'
import { getErrorMessage } from '../../utils/error-message'
import {
  CreateReviewModal,
  DeleteReviewModal,
  getCustomerReview,
  ReviewSection,
} from './CustomerReviewSection'
import { PaymentsSection } from './PaymentsSection'
import {
  CUSTOMERS_SEARCH_STORAGE_KEY,
  LAST_VISITED_CUSTOMER_STORAGE_KEY,
} from '../Customers/customerListState'

function buildCustomerDetailUrl(customerId: string, dueDay: number | null) {
  const url = new URL(`${CUSTOMERS_URL}/${customerId}`)

  if (dueDay !== null) {
    url.searchParams.set('dueDay', dueDay.toString())
  }

  return url.toString()
}

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

function formatPercent(value: number) {
  return `${value.toLocaleString('es-AR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}%`
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

function HighlightValue({ children }: { children: ReactNode }) {
  return (
    <Text component="span" fw={700}>
      {children}
    </Text>
  )
}

function BehaviorSection({ behavior }: { behavior: CustomerBehavior }) {
  return (
    <Stack gap="md">
      <Group gap="xs">
        <ThemeIcon variant="light" radius="md">
          <IconInfoSquareRounded size={18} />
        </ThemeIcon>
        <Title order={2}>Comportamiento</Title>
      </Group>

      <Alert color="gray" variant="light">
        Historial de pagos: registra{' '}
        <HighlightValue>{numberFormatter.format(behavior.invoices)}</HighlightValue>{' '}
        facturas emitidas, con{' '}
        <HighlightValue>{numberFormatter.format(behavior.paidLate)}</HighlightValue>{' '}
        (<HighlightValue>{formatPercent(behavior.latePaymentPercentage)}</HighlightValue>)
        pagos fuera de término y un atraso promedio de{' '}
        <HighlightValue>
          {numberFormatter.format(Math.ceil(behavior.averageLateDays))}
        </HighlightValue>{' '}
        días.
      </Alert>
    </Stack>
  )
}

function DeactivateCustomerSection({ onDeactivate }: { onDeactivate: () => void }) {
  return (
    <Stack gap="md">
      <Group gap="xs">
        <ThemeIcon color="gray" variant="light" radius="md">
          <IconAlertTriangle size={18} />
        </ThemeIcon>
        <Title order={2}>Dar de baja</Title>
      </Group>

      <Alert color="gray" variant="light" title="Baja del cliente">
        Podés dar de baja este cliente cuando ya no corresponda seguir
        gestionándolo.
      </Alert>

      <Group justify="flex-end">
        <Button variant="default" onClick={onDeactivate}>
          Dar de baja
        </Button>
      </Group>
    </Stack>
  )
}

function DeactivateCustomerModal({
  customerId,
  opened,
  onClose,
  onDeactivated,
}: {
  customerId: number
  opened: boolean
  onClose: () => void
  onDeactivated: () => void
}) {
  const [secondsLeft, setSecondsLeft] = useState(3)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const canDeactivate = secondsLeft === 0

  useEffect(() => {
    if (!opened) {
      setSecondsLeft(3)
      setIsSubmitting(false)
      setErrorMessage('')
      return
    }

    if (secondsLeft === 0) {
      return
    }

    const timeoutID = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => window.clearTimeout(timeoutID)
  }, [opened, secondsLeft])

  async function handleDeactivate() {
    try {
      setIsSubmitting(true)
      setErrorMessage('')

      const response = await fetch(`${CUSTOMERS_URL}/${customerId}/deactivated`, {
        body: JSON.stringify({ deactivated: true }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })

      if (!response.ok) {
        throw new Error('No se pudo dar de baja el cliente.')
      }

      onDeactivated()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Dar de baja cliente" centered>
      <Stack gap="md">
        <Alert color="red" variant="light" title="Confirmar baja">
          Esta acción no es reversible.
        </Alert>

        {errorMessage ? (
          <Alert color="red" variant="light">
            {errorMessage}
          </Alert>
        ) : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            color="red"
            disabled={!canDeactivate}
            loading={isSubmitting}
            onClick={handleDeactivate}
          >
            {canDeactivate ? 'Dar de baja' : `Dar de baja (${secondsLeft})`}
          </Button>
        </Group>
      </Stack>
    </Modal>
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
        <Group gap="xs">
          <ThemeIcon variant="light" radius="md">
            <IconTimelineEvent size={18} />
          </ThemeIcon>
          <Title order={2}>Acciones</Title>
        </Group>
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

export function CustomerDetailPage() {
  const { customerId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { dueDay, informantName } = useInformantSession()
  const { getCustomerViewers, notifyCustomerLeave, notifyCustomerView } =
    useCustomerViewers()
  const [status, setStatus] = useState<AsyncStatus>('loading')
  const [data, setData] = useState<CustomerDetailResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [contactModal, setContactModal] = useState<ContactModalData | null>(
    null,
  )
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false)
  const [isCreateReviewModalOpen, setIsCreateReviewModalOpen] = useState(false)
  const [isDeleteReviewModalOpen, setIsDeleteReviewModalOpen] = useState(false)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false)
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false)
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

    const response = await fetch(buildCustomerDetailUrl(customerId, dueDay), {
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

  async function handleReviewSaved() {
    await refreshCustomerDetail()
    navigate(routePaths.customers)
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
  }, [customerId, dueDay])

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
  const customerReview = getCustomerReview(data)
  const effectiveDueDay = dueDay ?? data?.debt.dueDay ?? null
  const customersSearch =
    (location.state as { customersSearch?: string } | null)?.customersSearch ??
    localStorage.getItem(CUSTOMERS_SEARCH_STORAGE_KEY) ??
    ''
  const customersPath = `${routePaths.customers}${customersSearch}`

  useEffect(() => {
    if (customerId) {
      localStorage.setItem(LAST_VISITED_CUSTOMER_STORAGE_KEY, customerId)
    }
  }, [customerId])

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Anchor component={Link} to={customersPath}>
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

                <Group gap="sm">
                  {!customerReview.isReviewed ? (
                    <Button onClick={() => setIsCreateReviewModalOpen(true)}>
                      Marcar como revisado
                    </Button>
                  ) : null}
                </Group>
              </Group>

              {customerReview.isReviewed ? (
                <>
                  <ReviewSection
                    review={customerReview}
                    onDelete={() => setIsDeleteReviewModalOpen(true)}
                  />

                  <Divider />
                </>
              ) : null}

              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <ThemeIcon variant="light" radius="md">
                      <IconInfoCircle size={18} />
                    </ThemeIcon>
                    <Title order={2}>Info</Title>
                  </Group>
                  <Button
                    variant="light"
                    onClick={() => setIsEditCustomerModalOpen(true)}
                  >
                    Editar
                  </Button>
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
                    value={
                      effectiveDueDay === null
                        ? '-'
                        : numberFormatter.format(effectiveDueDay)
                    }
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

              <BehaviorSection behavior={data.behavior} />

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
                customerId={data.customer.id}
                dueDay={effectiveDueDay ?? data.debt.dueDay}
                onPaymentRegistered={refreshCustomerDetail}
                payments={data.payments}
              />

              <Divider />

              <DeactivateCustomerSection
                onDeactivate={() => setIsDeactivateModalOpen(true)}
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
          <CreateReviewModal
            customerId={data.customer.id}
            informantName={informantName}
            opened={isCreateReviewModalOpen}
            onClose={() => setIsCreateReviewModalOpen(false)}
            onSaved={handleReviewSaved}
          />
        ) : null}

        {data ? (
          <DeleteReviewModal
            customerId={data.customer.id}
            opened={isDeleteReviewModalOpen}
            onClose={() => setIsDeleteReviewModalOpen(false)}
            onDeleted={refreshCustomerDetail}
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

        {data ? (
          <DeactivateCustomerModal
            customerId={data.customer.id}
            opened={isDeactivateModalOpen}
            onClose={() => setIsDeactivateModalOpen(false)}
            onDeactivated={() => navigate(customersPath)}
          />
        ) : null}
      </Stack>
    </Container>
  )
}
