import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Anchor,
  Button,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconCash, IconInfoCircle, IconNotes } from '@tabler/icons-react'

import { CustomerViewersAvatars } from '../../customer-viewers/CustomerViewersAvatars'
import { useCustomerViewers } from '../../customer-viewers/CustomerViewers'
import { CUSTOMERS_URL } from '../../config/api'
import { routePaths } from '../../routes/paths'
import { useInformantSession } from '../../session/InformantSession'
import type { AsyncStatus } from '../../types/async-status'
import type {
  CustomerAction,
  CustomerDetailResponse,
} from '../../types/customer'
import { getErrorMessage } from '../../utils/error-message'
import {
  CUSTOMERS_SEARCH_STORAGE_KEY,
  LAST_VISITED_CUSTOMER_STORAGE_KEY,
} from '../Customers/customerListState'
import {
  ActionsSection,
  AddActionModal,
  DeleteActionModal,
  EditActionCommentsModal,
} from './CustomerActionsSection'
import {
  ContactInfoItem,
  ContactModal,
  type ContactModalData,
  EditCommentsModal,
  EditCustomerModal,
} from './CustomerDetailModals'
import {
  BehaviorSection,
  DebtInfoItem,
  InfoItem,
} from './CustomerDetailSections'
import {
  companyTypeLabels,
  currencyFormatter,
  formatDate,
  numberFormatter,
} from './customerDetailHelpers'
import {
  CreateReviewModal,
  DeleteReviewModal,
  getCustomerReview,
  ReviewSection,
} from './CustomerReviewSection'
import {
  DeactivateCustomerModal,
  DeactivateCustomerSection,
} from './DeactivateCustomer'
import { PaymentsSection } from './PaymentsSection'

function buildCustomerDetailUrl(customerId: string, dueDay: number | null) {
  const url = new URL(`${CUSTOMERS_URL}/${customerId}`)

  if (dueDay !== null) {
    url.searchParams.set('dueDay', dueDay.toString())
  }

  return url.toString()
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

  const customersSearch =
    (location.state as { customersSearch?: string } | null)?.customersSearch ??
    localStorage.getItem(CUSTOMERS_SEARCH_STORAGE_KEY) ??
    ''
  const customersPath = `${routePaths.customers}${customersSearch}`

  const fetchCustomerDetail = useCallback(async (signal?: AbortSignal) => {
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
  }, [customerId, dueDay])

  async function refreshCustomerDetail() {
    await fetchCustomerDetail()
  }

  async function handleReviewSaved() {
    await refreshCustomerDetail()
    navigate(customersPath)
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
  }, [fetchCustomerDetail])

  useEffect(() => {
    const parsedCustomerID = customerId ? Number(customerId) : NaN

    if (Number.isFinite(parsedCustomerID)) {
      notifyCustomerView(parsedCustomerID)
    }

    return () => {
      notifyCustomerLeave()
    }
  }, [customerId, notifyCustomerLeave, notifyCustomerView])

  useEffect(() => {
    if (customerId) {
      localStorage.setItem(LAST_VISITED_CUSTOMER_STORAGE_KEY, customerId)
    }
  }, [customerId])

  const currentCustomerViewers = data
    ? getCustomerViewers(data.customer.id)
    : []
  const customerReview = getCustomerReview(data)
  const effectiveDueDay = dueDay ?? data?.debt.dueDay ?? null

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

                {!customerReview.isReviewed ? (
                  <Button onClick={() => setIsCreateReviewModalOpen(true)}>
                    Marcar como revisado
                  </Button>
                ) : null}
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
          <>
            <EditCustomerModal
              customer={data.customer}
              opened={isEditCustomerModalOpen}
              onClose={() => setIsEditCustomerModalOpen(false)}
              onSaved={refreshCustomerDetail}
            />
            <CreateReviewModal
              customerId={data.customer.id}
              informantName={informantName}
              opened={isCreateReviewModalOpen}
              onClose={() => setIsCreateReviewModalOpen(false)}
              onSaved={handleReviewSaved}
            />
            <DeleteReviewModal
              customerId={data.customer.id}
              opened={isDeleteReviewModalOpen}
              onClose={() => setIsDeleteReviewModalOpen(false)}
              onDeleted={refreshCustomerDetail}
            />
            <AddActionModal
              customerId={data.customer.id}
              informantName={informantName}
              opened={isActionModalOpen}
              onClose={() => setIsActionModalOpen(false)}
              onSaved={refreshCustomerDetail}
            />
            <EditCommentsModal
              customerId={data.customer.id}
              initialComments={data.customer.comments}
              opened={isCommentsModalOpen}
              onClose={() => setIsCommentsModalOpen(false)}
              onSaved={refreshCustomerDetail}
            />
            <EditActionCommentsModal
              customerId={data.customer.id}
              action={editingAction}
              onClose={() => setEditingAction(null)}
              onSaved={refreshCustomerDetail}
            />
            <DeleteActionModal
              customerId={data.customer.id}
              action={deletingAction}
              onClose={() => setDeletingAction(null)}
              onDeleted={refreshCustomerDetail}
            />
            <DeactivateCustomerModal
              customerId={data.customer.id}
              opened={isDeactivateModalOpen}
              onClose={() => setIsDeactivateModalOpen(false)}
              onDeactivated={() => navigate(customersPath)}
            />
          </>
        ) : null}
      </Stack>
    </Container>
  )
}
