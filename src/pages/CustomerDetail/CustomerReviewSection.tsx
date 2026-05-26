import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconEyeCheck } from '@tabler/icons-react'

import { CUSTOMERS_URL } from '../../config/api'
import type { CustomerDetailResponse, CustomerReview } from '../../types/customer'
import { getErrorMessage } from '../../utils/error-message'

const emptyReview: CustomerReview = {
  reviewedAt: null,
  reviewedUntil: null,
  reviewedBy: null,
  isReviewed: false,
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatNullableDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : '-'
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

export function getCustomerReview(data: CustomerDetailResponse | null) {
  return data?.review ?? data?.debt.review ?? data?.customer.review ?? emptyReview
}

export function ReviewSection({
  onDelete,
  review,
}: {
  onDelete: () => void
  review: CustomerReview
}) {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <ThemeIcon variant="light" radius="md" color="green">
            <IconEyeCheck size={18} />
          </ThemeIcon>
          <Title order={2}>Revisión</Title>
        </Group>

        <Button color="red" variant="light" onClick={onDelete}>
          Borrar
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        <InfoItem
          label="Revisado"
          value={formatNullableDateTime(review.reviewedAt)}
        />
        <InfoItem label="Por" value={review.reviewedBy ?? '-'} />
        <InfoItem
          label="No revisar hasta"
          value={formatNullableDateTime(review.reviewedUntil)}
        />
      </SimpleGrid>
    </Stack>
  )
}

export function CreateReviewModal({
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
  const [days, setDays] = useState<string | number>(7)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (opened) {
      setDays(7)
      setErrorMessage('')
    }
  }, [opened])

  async function handleSave() {
    const parsedDays = Number(days)

    if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
      setErrorMessage('La cantidad de días no es valida.')
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')

      const response = await fetch(`${CUSTOMERS_URL}/${customerId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          days: parsedDays,
          reviewedBy: informantName,
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo crear la revisión.')
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
    <Modal opened={opened} onClose={handleCancel} title="Crear revisión" centered>
      <Stack gap="md">
        <NumberInput
          label="Días"
          min={1}
          step={1}
          value={days}
          onChange={setDays}
          required
        />

        {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={handleCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={isSaving} disabled={days === ''}>
            Guardar
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export function DeleteReviewModal({
  customerId,
  opened,
  onClose,
  onDeleted,
}: {
  customerId: number
  opened: boolean
  onClose: () => void
  onDeleted: () => Promise<void>
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (opened) {
      setErrorMessage('')
    }
  }, [opened])

  async function handleDelete() {
    try {
      setIsDeleting(true)
      setErrorMessage('')

      const response = await fetch(`${CUSTOMERS_URL}/${customerId}/review`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('No se pudo borrar la revisión.')
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
      opened={opened}
      onClose={handleCancel}
      title="Borrar revisión"
      centered
    >
      <Stack gap="md">
        <Text>¿Seguro que queres borrar esta revisión?</Text>

        {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={handleCancel} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button color="red" onClick={handleDelete} loading={isDeleting}>
            Borrar
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
