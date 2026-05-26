import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Center,
  Container,
  Group,
  Loader,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useInformantSession } from '../../session/InformantSession'
import type { AsyncStatus } from '../../types/async-status'
import { getErrorMessage } from '../../utils/error-message'

const MONTHLY_DELINQUENCY_URL =
  'http://localhost:8080/customers/monthly-delinquency'
const CUSTOMER_METRICS_URL = 'http://localhost:8080/customers/metrics'

const monthLabels = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

const companyTypeLabels: Record<string, string> = {
  enterprise: 'Empresa',
  pyme: 'PyME',
  startup: 'Startup',
}

const chartColors = [
  'var(--mantine-color-blue-6)',
  'var(--mantine-color-green-6)',
  'var(--mantine-color-yellow-6)',
  'var(--mantine-color-red-6)',
]

type MonthlyDelinquencyResponseItem = {
  month?: number
  percentage?: number
  delinquencyPercentage?: number
  delinquentPercentage?: number
  overduePercentage?: number
  percent?: number
  value?: number
}

type MonthlyDelinquencyChartItem = {
  month: number
  monthLabel: string
  percentage: number
}

type CompanyTypeMetric = {
  companyType: string
  customers: number
  percentage: number
}

type CustomerMetrics = {
  dueDay: number
  totalCustomers: number
  companyTypes: CompanyTypeMetric[]
  debtors: {
    customers: number
    percentage: number
    byCompanyType: CompanyTypeMetric[]
  }
}

type PieChartItem = {
  name: string
  customers: number
  percentage: number
}

function buildMonthlyDelinquencyUrl(year: number, dueDay: number) {
  const url = new URL(MONTHLY_DELINQUENCY_URL)
  url.searchParams.set('year', year.toString())
  url.searchParams.set('dueDay', dueDay.toString())

  return url.toString()
}

function buildCustomerMetricsUrl(dueDay: number) {
  const url = new URL(CUSTOMER_METRICS_URL)
  url.searchParams.set('dueDay', dueDay.toString())

  return url.toString()
}

function getResponseItems(data: unknown) {
  if (Array.isArray(data)) {
    return data as MonthlyDelinquencyResponseItem[]
  }

  if (
    data &&
    typeof data === 'object' &&
    'items' in data &&
    Array.isArray(data.items)
  ) {
    return data.items as MonthlyDelinquencyResponseItem[]
  }

  return []
}

function getPercentage(item: MonthlyDelinquencyResponseItem) {
  const rawValue =
    item.percentage ??
    item.delinquencyPercentage ??
    item.delinquentPercentage ??
    item.overduePercentage ??
    item.percent ??
    item.value ??
    0

  return rawValue <= 1 ? rawValue * 100 : rawValue
}

function normalizeMonthlyDelinquency(data: unknown) {
  const items = getResponseItems(data)

  return items
    .map((item) => ({
      month: item.month ?? 0,
      monthLabel: monthLabels[(item.month ?? 1) - 1] ?? '-',
      percentage: Number(getPercentage(item).toFixed(2)),
    }))
    .filter((item) => item.month >= 1 && item.month <= 12)
    .sort((a, b) => a.month - b.month)
}

function formatPercent(value: number) {
  return `${value.toLocaleString('es-AR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}%`
}

function formatNumber(value: number) {
  return value.toLocaleString('es-AR')
}

function getCompanyTypeLabel(companyType: string) {
  return companyTypeLabels[companyType] ?? companyType
}

function buildCompanyTypePieData(companyTypes: CompanyTypeMetric[]) {
  return companyTypes.map((item) => ({
    name: getCompanyTypeLabel(item.companyType),
    customers: item.customers,
    percentage: item.percentage,
  }))
}

function buildDebtorsPieData(metrics: CustomerMetrics) {
  const debtors = metrics.debtors.customers
  const nonDebtors = Math.max(metrics.totalCustomers - debtors, 0)

  return [
    {
      name: 'Deudores',
      customers: debtors,
      percentage: metrics.debtors.percentage,
    },
    {
      name: 'Al día',
      customers: nonDebtors,
      percentage:
        metrics.totalCustomers === 0
          ? 0
          : (nonDebtors / metrics.totalCustomers) * 100,
    },
  ]
}

function buildDebtorsByCompanyTypePieData(companyTypes: CompanyTypeMetric[]) {
  return companyTypes.map((item) => ({
    name: getCompanyTypeLabel(item.companyType),
    customers: item.customers,
    percentage: item.percentage,
  }))
}

function MetricsPieChart({ data }: { data: PieChartItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="customers"
          nameKey="name"
          innerRadius="55%"
          outerRadius="82%"
          paddingAngle={2}
        >
          {data.map((item, index) => (
            <Cell
              key={item.name}
              fill={chartColors[index % chartColors.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(_, __, item) => {
            const payload = item.payload as PieChartItem

            return [
              `${formatNumber(payload.customers)} (${formatPercent(
                payload.percentage,
              )})`,
              payload.name,
            ]
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function PieLegend({ data }: { data: PieChartItem[] }) {
  return (
    <Stack gap={6}>
      {data.map((item, index) => (
        <Group key={item.name} justify="space-between" gap="sm" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Box
              style={{
                background: chartColors[index % chartColors.length],
                borderRadius: 999,
                height: 10,
                width: 10,
              }}
            />
            <Text size="sm">{item.name}</Text>
          </Group>
          <Text size="sm" fw={600}>
            {formatPercent(item.percentage)}
          </Text>
        </Group>
      ))}
    </Stack>
  )
}

export function HomePage() {
  const { dueDay: storedDueDay } = useInformantSession()
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const [year, setYear] = useState(new Date().getFullYear())
  const [dueDay, setDueDay] = useState(storedDueDay ?? 10)
  const [status, setStatus] = useState<AsyncStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [chartData, setChartData] = useState<MonthlyDelinquencyChartItem[]>([])
  const [metricsStatus, setMetricsStatus] = useState<AsyncStatus>('loading')
  const [metricsErrorMessage, setMetricsErrorMessage] = useState('')
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchMonthlyDelinquency() {
      try {
        setStatus('loading')
        setErrorMessage('')

        const response = await fetch(buildMonthlyDelinquencyUrl(year, dueDay), {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('No se pudo obtener la morosidad mensual.')
        }

        const data = await response.json()
        setChartData(normalizeMonthlyDelinquency(data))
        setStatus('ok')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setErrorMessage(getErrorMessage(error))
        setStatus('error')
      }
    }

    void fetchMonthlyDelinquency()

    return () => controller.abort()
  }, [dueDay, year])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchCustomerMetrics() {
      try {
        setMetricsStatus('loading')
        setMetricsErrorMessage('')

        const response = await fetch(buildCustomerMetricsUrl(dueDay), {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('No se pudieron obtener las métricas.')
        }

        const data = (await response.json()) as CustomerMetrics
        setMetrics(data)
        setMetricsStatus('ok')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setMetricsErrorMessage(getErrorMessage(error))
        setMetricsStatus('error')
      }
    }

    void fetchCustomerMetrics()

    return () => controller.abort()
  }, [dueDay])

  const companyTypePieData = metrics
    ? buildCompanyTypePieData(metrics.companyTypes)
    : []
  const debtorsPieData = metrics ? buildDebtorsPieData(metrics) : []
  const debtorsByCompanyTypePieData = metrics
    ? buildDebtorsByCompanyTypePieData(metrics.debtors.byCompanyType)
    : []

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>Dashboard</Title>
            <Text mt="xs" c="dimmed">
              Indicadores de cobranzas.
            </Text>
          </div>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Paper withBorder radius="md" p="xl" className="bg-white">
            <Stack gap="lg">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Title order={2}>Porcentaje de deudores por mes</Title>
                  <Text mt={4} c="dimmed" size="sm">
                    Año {year} · vencimiento día {dueDay}
                  </Text>
                </div>

                <SimpleGrid cols={{ base: 1, sm: 2 }} w={{ base: '100%', sm: 260 }}>
                  <NumberInput
                    label="Año"
                    min={2000}
                    max={2100}
                    step={1}
                    value={year}
                    onChange={(value) => setYear(Number(value) || year)}
                  />
                  <NumberInput
                    label="Día"
                    min={1}
                    max={31}
                    step={1}
                    value={dueDay}
                    onChange={(value) => setDueDay(Number(value) || dueDay)}
                  />
                </SimpleGrid>
              </Group>

              {status === 'loading' ? (
                <Center h={320}>
                  <Loader />
                </Center>
              ) : null}

              {status === 'error' ? (
                <Alert color="red" title="Error al cargar dashboard">
                  {errorMessage}
                </Alert>
              ) : null}

              {status === 'ok' ? (
                chartData.length === 0 ? (
                  <Text c="dimmed">Sin datos para los filtros seleccionados.</Text>
                ) : (
                  <Box h={320}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData.filter(
                          (item) => year !== currentYear || item.month <= currentMonth,
                        )}
                        margin={{ top: 16, right: 24, bottom: 8, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="monthLabel" tickLine={false} />
                        <YAxis
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                          tickLine={false}
                          width={48}
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatPercent(Number(value)),
                            'Deudores',
                          ]}
                          labelFormatter={(label) => `Mes: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="percentage"
                          name="Deudores"
                          stroke="var(--mantine-color-blue-6)"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                )
              ) : null}
            </Stack>
          </Paper>

          <Paper withBorder radius="md" p="xl" className="bg-white">
            <Stack gap="lg">
              <div>
                <Title order={2}>Clientes</Title>
                <Text mt={4} c="dimmed" size="sm">
                  Métricas con vencimiento día {dueDay}
                </Text>
              </div>

              {metricsStatus === 'loading' ? (
                <Center h={320}>
                  <Loader />
                </Center>
              ) : null}

              {metricsStatus === 'error' ? (
                <Alert color="red" title="Error al cargar métricas">
                  {metricsErrorMessage}
                </Alert>
              ) : null}

              {metricsStatus === 'ok' && metrics ? (
                <Stack gap="lg">
                  <div>
                    <Text size="sm" c="dimmed">
                      Clientes totales
                    </Text>
                    <Text fw={700} size="xl">
                      {formatNumber(metrics.totalCustomers)}
                    </Text>
                  </div>

                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                    <Stack gap="sm">
                      <Text fw={700}>Por tipo</Text>
                      <Box h={170}>
                        <MetricsPieChart data={companyTypePieData} />
                      </Box>
                      <PieLegend data={companyTypePieData} />
                    </Stack>

                    <Stack gap="sm">
                      <Text fw={700}>Deudores</Text>
                      <Box h={170}>
                        <MetricsPieChart data={debtorsPieData} />
                      </Box>
                      <PieLegend data={debtorsPieData} />
                    </Stack>

                    <Stack gap="sm">
                      <Text fw={700}>Deudores por tipo</Text>
                      <Box h={170}>
                        <MetricsPieChart data={debtorsByCompanyTypePieData} />
                      </Box>
                      <PieLegend data={debtorsByCompanyTypePieData} />
                    </Stack>
                  </SimpleGrid>
                </Stack>
              ) : null}
            </Stack>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Container>
  )
}
