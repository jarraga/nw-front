/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import {
  ActionIcon as MantineActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconDots,
  IconMail,
  IconMapPin,
  IconPencil,
  IconPhone,
  IconTimelineEvent,
  IconTrash,
} from '@tabler/icons-react'

import { CUSTOMERS_URL } from '../../config/api'
import type {
  CustomerAction,
  CustomerActionType,
} from '../../types/customer'
import { getErrorMessage } from '../../utils/error-message'

type ActionTypeOption = {
  value: CustomerActionType
  label: string
  icon: typeof IconPhone
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

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

function getActionIcon(type: CustomerActionType) {
  if (type === 'call') return IconPhone
  if (type === 'email') return IconMail
  if (type === 'personal_visit') return IconMapPin

  return IconDots
}

export function AddActionModal({
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
    <Modal opened={opened} onClose={handleCancel} title="Agregar accion" centered>
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

export function EditActionCommentsModal({
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

export function DeleteActionModal({
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
        <Text>Seguro que queres eliminar esta accion?</Text>

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

export function ActionsSection({
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
        <Button onClick={onAddAction}>Agregar accion</Button>
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
                {showAllActions ? 'Mostrar menos' : 'Mostrar mas'}
              </Button>
            </Group>
          ) : null}
        </Stack>
      )}
    </Stack>
  )
}
