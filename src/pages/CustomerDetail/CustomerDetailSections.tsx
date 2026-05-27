import type { ReactNode } from 'react'
import { Alert, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconInfoSquareRounded } from '@tabler/icons-react'

import type { CustomerBehavior } from '../../types/customer'
import { formatPercent, numberFormatter } from './customerDetailHelpers'

export function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fw={600}>{value}</Text>
    </div>
  )
}

export function DebtInfoItem({ label, value }: { label: string; value: string }) {
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

export function BehaviorSection({ behavior }: { behavior: CustomerBehavior }) {
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
        pagos fuera de termino y un atraso promedio de{' '}
        <HighlightValue>
          {numberFormatter.format(Math.ceil(behavior.averageLateDays))}
        </HighlightValue>{' '}
        dias.
      </Alert>
    </Stack>
  )
}
