/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import {
  Alert,
  Anchor,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { QRCodeSVG } from 'qrcode.react'

import { CUSTOMERS_URL } from '../../config/api'
import type { CustomerDetailResponse } from '../../types/customer'
import { getErrorMessage } from '../../utils/error-message'

export type ContactModalData = {
  label: string
  actionLabel: string
  value: string
  href: string
}

export function ContactInfoItem({
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

export function ContactModal({
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

export function EditCustomerModal({
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

export function EditCommentsModal({
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
