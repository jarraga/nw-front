import { useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Tabs,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconCalendarDollar } from '@tabler/icons-react'

import { CUSTOMERS_URL } from '../../config/api'
import type { CustomerPayment } from '../../types/customer'
import { getErrorMessage } from '../../utils/error-message'

const currentDate = new Date()
const currentYear = currentDate.getFullYear()

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

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : '-'
}

function isPaymentOnTime({
  dueDay,
  month,
  paidAt,
  year,
}: {
  dueDay: number
  month: number
  paidAt: string
  year: number
}) {
  const dueDate = buildDate(year, month, dueDay)
  dueDate.setHours(23, 59, 59, 999)

  return new Date(paidAt) <= dueDate
}

function PaymentStatusBadge({
  dueDay,
  month,
  paidAt,
  year,
}: {
  dueDay: number
  month: number
  paidAt: string
  year: number
}) {
  if (isPaymentOnTime({ dueDay, month, paidAt, year })) {
    return (
      <Badge color="green" variant="light">
        A tiempo
      </Badge>
    )
  }

  return (
    <Badge color="yellow" variant="light">
      Fuera de término
    </Badge>
  )
}

function groupPaymentsByYear(payments: CustomerPayment[]) {
  return payments.reduce<Record<number, CustomerPayment[]>>((acc, payment) => {
    acc[payment.year] = [...(acc[payment.year] ?? []), payment]
    return acc
  }, {})
}

function getMonthDays(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function buildDate(year: number, month: number, day: number) {
  return new Date(year, month - 1, Math.min(day, getMonthDays(year, month)))
}

function getFirstPaymentDate(payments: CustomerPayment[], dueDay: number) {
  const firstPayment = [...payments].sort(
    (a, b) => a.year - b.year || a.month - b.month,
  )[0]

  if (!firstPayment) {
    return null
  }

  return buildDate(firstPayment.year, firstPayment.month, dueDay)
}

function getDueMonthsForYear(year: number, firstPaymentDate: Date, dueDay: number) {
  return Array.from({ length: 12 }, (_, index) => index + 1).filter((month) => {
    const dueDate = buildDate(year, month, dueDay)

    return dueDate >= firstPaymentDate && dueDate <= currentDate
  })
}

function getPaymentYears(payments: CustomerPayment[], dueDay: number) {
  const firstPaymentDate = getFirstPaymentDate(payments, dueDay)
  const paymentYears = payments.map((payment) => payment.year)
  const dueYears =
    firstPaymentDate !== null && firstPaymentDate <= currentDate
      ? Array.from(
          { length: currentYear - firstPaymentDate.getFullYear() + 1 },
          (_, index) => firstPaymentDate.getFullYear() + index,
        )
      : []

  return Array.from(new Set([...paymentYears, ...dueYears])).sort(
    (a, b) => a - b,
  )
}

function buildPaymentRows(
  year: number,
  payments: CustomerPayment[],
  firstPaymentDate: Date | null,
  dueDay: number,
) {
  const dueMonths =
    firstPaymentDate === null
      ? []
      : getDueMonthsForYear(year, firstPaymentDate, dueDay)
  const paymentMonths = payments.map((payment) => payment.month)

  return Array.from(new Set([...dueMonths, ...paymentMonths]))
    .sort((a, b) => a - b)
    .map((month) => ({
      month,
      payment: payments.find((payment) => payment.month === month),
    }))
}

export function PaymentsSection({
  customerId,
  dueDay,
  onPaymentRegistered,
  payments,
}: {
  customerId: number
  dueDay: number
  onPaymentRegistered: () => Promise<void>
  payments: CustomerPayment[]
}) {
  const [paymentToRegister, setPaymentToRegister] = useState<{
    month: number
    year: number
  } | null>(null)
  const [paidAt, setPaidAt] = useState('')
  const [savingPaymentKey, setSavingPaymentKey] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const paymentsByYear = useMemo(() => groupPaymentsByYear(payments), [payments])
  const firstPaymentDate = useMemo(
    () => getFirstPaymentDate(payments, dueDay),
    [dueDay, payments],
  )
  const years = useMemo(
    () => getPaymentYears(payments, dueDay),
    [dueDay, payments],
  )
  const defaultYear = years.at(-1)?.toString()

  function handleOpenPaymentModal(year: number, month: number) {
    setPaymentToRegister({ month, year })
    setPaidAt(new Date().toISOString().slice(0, 10))
    setErrorMessage('')
  }

  function handleClosePaymentModal() {
    if (savingPaymentKey) {
      return
    }

    setPaymentToRegister(null)
    setPaidAt('')
    setErrorMessage('')
  }

  async function handleRegisterPayment() {
    if (!paymentToRegister || !paidAt) {
      return
    }

    const paymentKey = `${paymentToRegister.year}-${paymentToRegister.month}`

    try {
      setSavingPaymentKey(paymentKey)
      setErrorMessage('')

      const response = await fetch(`${CUSTOMERS_URL}/${customerId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: paymentToRegister.year,
          month: paymentToRegister.month,
          paidAt: new Date(`${paidAt}T00:00:00`).toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo registrar el pago.')
      }

      await onPaymentRegistered()
      setPaymentToRegister(null)
      setPaidAt('')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setSavingPaymentKey('')
    }
  }

  return (
    <Stack gap="md">
      <Group gap="xs">
        <ThemeIcon variant="light" radius="md">
          <IconCalendarDollar size={18} />
        </ThemeIcon>
        <Title order={2}>Pagos</Title>
      </Group>

      {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}

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
              firstPaymentDate,
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
                              <Group gap="xs">
                                <Text>{formatDate(payment.paidAt)}</Text>
                                <PaymentStatusBadge
                                  dueDay={dueDay}
                                  month={month}
                                  paidAt={payment.paidAt}
                                  year={year}
                                />
                              </Group>
                            ) : (
                              <Button
                                size="xs"
                                variant="light"
                                onClick={() => handleOpenPaymentModal(year, month)}
                              >
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

      <Modal
        opened={paymentToRegister !== null}
        onClose={handleClosePaymentModal}
        title="Registrar pago"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Fecha de pago"
            type="date"
            value={paidAt}
            onChange={(event) => setPaidAt(event.currentTarget.value)}
            required
          />

          {paymentToRegister ? (
            <Text size="sm" c="dimmed">
              {monthLabels[paymentToRegister.month - 1]} {paymentToRegister.year}
            </Text>
          ) : null}

          {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={handleClosePaymentModal}
              disabled={savingPaymentKey !== ''}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegisterPayment}
              loading={
                paymentToRegister !== null &&
                savingPaymentKey ===
                  `${paymentToRegister.year}-${paymentToRegister.month}`
              }
              disabled={!paidAt}
            >
              Guardar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
