/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'

import { CUSTOMERS_URL } from '../../config/api'
import { getErrorMessage } from '../../utils/error-message'

export function DeactivateCustomerSection({
  onDeactivate,
}: {
  onDeactivate: () => void
}) {
  return (
    <Stack gap="md">
      <Group gap="xs">
        <ThemeIcon color="gray" variant="light" radius="md">
          <IconAlertTriangle size={18} />
        </ThemeIcon>
        <Title order={2}>Dar de baja</Title>
      </Group>

      <Alert color="gray" variant="light" title="Baja del cliente">
        Podes dar de baja este cliente cuando ya no corresponda seguir
        gestionandolo.
      </Alert>

      <Group justify="flex-end">
        <Button variant="default" onClick={onDeactivate}>
          Dar de baja
        </Button>
      </Group>
    </Stack>
  )
}

export function DeactivateCustomerModal({
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
          Esta accion no es reversible.
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
