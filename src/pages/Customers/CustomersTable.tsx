import { Link } from 'react-router-dom'
import {
  Anchor,
  Box,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core'
import { IconEyeCheck } from '@tabler/icons-react'

import { CustomerViewersAvatars } from '../../customer-viewers/CustomerViewersAvatars'
import { useCustomerViewers } from '../../customer-viewers/CustomerViewers'
import { routePaths } from '../../routes/paths'
import type { CustomerDebt } from '../../types/customer'
import {
  companyTypeLabels,
  numberFormatter,
} from './customersHelpers'

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})
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

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function formatNullableDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : '-'
}

function ReviewIndicator({ review }: { review: CustomerDebt['review'] }) {
  if (!review.isReviewed) {
    return null
  }

  return (
    <Tooltip
      withArrow
      label={
        <Stack gap={4}>
          <Text size="sm">Revisado: {formatNullableDateTime(review.reviewedAt)}</Text>
          <Text size="sm">Por: {review.reviewedBy ?? '-'}</Text>
          <Text size="sm">
            No revisar hasta: {formatNullableDateTime(review.reviewedUntil)}
          </Text>
        </Stack>
      }
    >
      <ThemeIcon variant="light" color="green" radius="xl" size="sm">
        <IconEyeCheck size={16} />
      </ThemeIcon>
    </Tooltip>
  )
}

export function CustomersTable({
  customers,
  lastVisitedCustomerID,
  search,
}: {
  customers: CustomerDebt[]
  lastVisitedCustomerID: string
  search: string
}) {
  const { getCustomerViewers } = useCustomerViewers()

  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Empresa</Table.Th>
            <Table.Th>Tipo de empresa</Table.Th>
            <Table.Th>Inicio de facturacion</Table.Th>
            <Table.Th>Abono mensual</Table.Th>
            <Table.Th>Meses vencidos</Table.Th>
            <Table.Th>Monto vencido</Table.Th>
            <Table.Th
              ta="center"
              style={{ width: 96, minWidth: 96, maxWidth: 96 }}
            >
              Revisado
            </Table.Th>
            <Table.Th
              ta="center"
              style={{ width: 104, minWidth: 104, maxWidth: 104 }}
            >
              Viendo
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {customers.map((customer) => {
            const viewers = getCustomerViewers(customer.id)
            const isLastVisited = customer.id.toString() === lastVisitedCustomerID

            return (
              <Table.Tr
                key={customer.id}
                bg={viewers.length > 0 ? 'blue.0' : undefined}
              >
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    {isLastVisited ? (
                      <Box
                        bg="blue"
                        style={{
                          alignSelf: 'stretch',
                          borderRadius: 999,
                          minHeight: 24,
                          width: 4,
                        }}
                      />
                    ) : null}
                    <Anchor
                      component={Link}
                      state={{ customersSearch: search }}
                      to={routePaths.customerDetail(customer.id)}
                    >
                      {customer.companyName}
                    </Anchor>
                  </Group>
                </Table.Td>
                <Table.Td>{companyTypeLabels[customer.companyType]}</Table.Td>
                <Table.Td>{formatDate(customer.billingStartedAt)}</Table.Td>
                <Table.Td>{currencyFormatter.format(customer.monthlyFee)}</Table.Td>
                <Table.Td>{numberFormatter.format(customer.overdueMonths)}</Table.Td>
                <Table.Td>{currencyFormatter.format(customer.overdueAmount)}</Table.Td>
                <Table.Td
                  ta="center"
                  style={{ width: 96, minWidth: 96, maxWidth: 96 }}
                >
                  <Group justify="center">
                    <ReviewIndicator review={customer.review} />
                  </Group>
                </Table.Td>
                <Table.Td
                  ta="center"
                  style={{ width: 104, minWidth: 104, maxWidth: 104 }}
                >
                  <CustomerViewersAvatars
                    justify="center"
                    maxVisible={3}
                    viewers={viewers}
                  />
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  )
}
