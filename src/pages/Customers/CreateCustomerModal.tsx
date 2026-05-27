import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'

import type { CompanyType } from '../../types/customer'
import {
  companyTypeLabels,
  type CreateCustomerForm,
} from './customersHelpers'

export function CreateCustomerModal({
  errorMessage,
  form,
  isSaving,
  onChange,
  onClose,
  onSave,
  opened,
}: {
  errorMessage: string
  form: CreateCustomerForm
  isSaving: boolean
  onChange: (field: keyof CreateCustomerForm, value: string) => void
  onClose: () => void
  onSave: () => void
  opened: boolean
}) {
  const canSave =
    form.companyName.trim() !== '' &&
    form.monthlyFee.trim() !== '' &&
    form.billingStartedAt.trim() !== ''

  return (
    <Modal opened={opened} onClose={onClose} title="Crear cliente" centered>
      <Stack gap="md">
        <TextInput
          label="Empresa"
          value={form.companyName}
          onChange={(event) =>
            onChange('companyName', event.currentTarget.value)
          }
          required
        />

        <Select
          label="Tipo de empresa"
          value={form.companyType}
          onChange={(value) =>
            onChange('companyType', (value ?? 'enterprise') as CompanyType)
          }
          data={[
            { value: 'enterprise', label: companyTypeLabels.enterprise },
            { value: 'pyme', label: companyTypeLabels.pyme },
            { value: 'startup', label: companyTypeLabels.startup },
          ]}
          allowDeselect={false}
          required
        />

        <TextInput
          label="Telefono"
          value={form.phone}
          onChange={(event) => onChange('phone', event.currentTarget.value)}
        />

        <TextInput
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => onChange('email', event.currentTarget.value)}
        />

        <TextInput
          label="Abono mensual"
          type="number"
          min={0}
          value={form.monthlyFee}
          onChange={(event) =>
            onChange('monthlyFee', event.currentTarget.value)
          }
          required
        />

        <TextInput
          label="Inicio de facturacion"
          type="date"
          value={form.billingStartedAt}
          onChange={(event) =>
            onChange('billingStartedAt', event.currentTarget.value)
          }
          required
        />

        <Textarea
          label="Comentarios"
          rows={4}
          value={form.comments}
          onChange={(event) => onChange('comments', event.currentTarget.value)}
        />

        {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={onSave} loading={isSaving} disabled={!canSave}>
            Crear
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
