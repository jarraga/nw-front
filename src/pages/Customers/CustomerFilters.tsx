import type { RefObject } from 'react'
import {
  Box,
  Button,
  CloseButton,
  Group,
  Radio,
  Select,
  Switch,
  Text,
  TextInput,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

import type { CustomerDebtSortBy } from '../../types/customer'
import {
  ALL_COMPANY_TYPES,
  companyTypeLabels,
  type CustomerCompanyTypeFilter,
} from './customersHelpers'

export function CustomerFilters({
  companyName,
  companyNameInputRef,
  companyType,
  includeReviewed,
  onClearCompanyName,
  onCompanyNameChange,
  onCompanyTypeChange,
  onIncludeReviewedChange,
  onResetFilters,
  onSortChange,
  sortBy,
}: {
  companyName: string
  companyNameInputRef: RefObject<HTMLInputElement | null>
  companyType: CustomerCompanyTypeFilter
  includeReviewed: boolean
  onClearCompanyName: () => void
  onCompanyNameChange: (value: string) => void
  onCompanyTypeChange: (value: string | null) => void
  onIncludeReviewedChange: (value: boolean) => void
  onResetFilters: () => void
  onSortChange: (value: string) => void
  sortBy: CustomerDebtSortBy
}) {
  const isCompactFilters = useMediaQuery('(max-width: 900px)')
  const filterSeparatorStyle = isCompactFilters
    ? { borderTop: '1px solid var(--mantine-color-gray-3)' }
    : { borderLeft: '1px solid var(--mantine-color-gray-3)' }

  return (
    <Box
      mb="md"
      style={{
        display: 'grid',
        gap: isCompactFilters ? 'var(--mantine-spacing-md)' : 0,
        gridTemplateColumns: isCompactFilters
          ? '1fr'
          : 'minmax(180px, 1fr) minmax(280px, 1.6fr) minmax(200px, 1.1fr) minmax(140px, 0.8fr) minmax(120px, 0.7fr)',
        width: '100%',
      }}
    >
      <Box pr={isCompactFilters ? 0 : 'md'}>
        <TextInput
          ref={companyNameInputRef}
          label="Buscar empresa"
          value={companyName}
          onChange={(event) => onCompanyNameChange(event.currentTarget.value)}
          rightSection={
            companyName ? (
              <CloseButton
                aria-label="Borrar busqueda"
                onClick={onClearCompanyName}
                onMouseDown={(event) => event.preventDefault()}
                size="sm"
              />
            ) : null
          }
        />
      </Box>

      <Box
        px={isCompactFilters ? 0 : 'md'}
        pt={isCompactFilters ? 'md' : 0}
        style={filterSeparatorStyle}
      >
        <Radio.Group
          label="Ordenar por"
          value={sortBy}
          onChange={onSortChange}
        >
          <Group mt={8} wrap="nowrap">
            <Radio value="amount" label="Monto vencido" />
            <Radio value="months" label="Meses vencidos" />
          </Group>
        </Radio.Group>
      </Box>

      <Box
        px={isCompactFilters ? 0 : 'md'}
        pt={isCompactFilters ? 'md' : 0}
        style={filterSeparatorStyle}
      >
        <Select
          label="Tipo de empresa"
          value={companyType}
          onChange={onCompanyTypeChange}
          data={[
            { value: ALL_COMPANY_TYPES, label: 'Todos' },
            { value: 'enterprise', label: companyTypeLabels.enterprise },
            { value: 'pyme', label: companyTypeLabels.pyme },
            { value: 'startup', label: companyTypeLabels.startup },
          ]}
          allowDeselect={false}
        />
      </Box>

      <Box
        pl={isCompactFilters ? 0 : 'md'}
        pt={isCompactFilters ? 'md' : 0}
        style={{
          alignItems: 'flex-start',
          ...filterSeparatorStyle,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 60,
        }}
      >
        <Text component="label" fw={500} mb={12} size="sm">
          Revisados
        </Text>
        <Switch
          label="Mostrar"
          checked={includeReviewed}
          onChange={(event) =>
            onIncludeReviewedChange(event.currentTarget.checked)
          }
        />
      </Box>

      <Box
        px={isCompactFilters ? 0 : 'md'}
        pt={isCompactFilters ? 'md' : 0}
        style={{
          alignItems: 'center',
          ...filterSeparatorStyle,
          display: 'flex',
          justifyContent: 'center',
          minHeight: 60,
        }}
      >
        <Button
          c="dimmed"
          fullWidth
          style={{
            height: 'auto',
            lineHeight: 1.2,
            minHeight: 44,
            textAlign: 'center',
            whiteSpace: 'normal',
          }}
          variant="default"
          onClick={onResetFilters}
        >
          Limpiar<br />filtros
        </Button>
      </Box>
    </Box>
  )
}
