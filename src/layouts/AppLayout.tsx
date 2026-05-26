import { useState } from 'react'
import {
  Alert,
  AppShell,
  Button,
  Group,
  Image,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconDownload,
  IconHome,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react'
import { NavLink, Outlet } from 'react-router-dom'

import { CUSTOMERS_URL } from '../config/api'
import { routePaths } from '../routes/paths'
import { useInformantSession } from '../session/InformantSession'

const navItems = [
  { icon: IconHome, label: 'Home', to: routePaths.home },
  { icon: IconUsers, label: 'Customers', to: routePaths.customers },
]

function getExportFilename(contentDisposition: string | null) {
  const fallbackFilename = 'customers.xlsx'

  if (!contentDisposition) {
    return fallbackFilename
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)

  return filenameMatch?.[1] ?? fallbackFilename
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function AppLayout() {
  const { dueDay, openSettings } = useInformantSession()
  const isCompactNav = useMediaQuery('(max-width: 1000px)')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportErrorMessage, setExportErrorMessage] = useState('')

  async function handleExportCustomers() {
    try {
      setIsExporting(true)
      setExportErrorMessage('')

      const response = await fetch(`${CUSTOMERS_URL}/export/xls`)

      if (!response.ok) {
        throw new Error('No se pudo exportar el archivo.')
      }

      const blob = await response.blob()
      const filename = getExportFilename(response.headers.get('Content-Disposition'))

      downloadBlob(blob, filename)
      setIsExportModalOpen(false)
    } catch (error) {
      setExportErrorMessage(
        error instanceof Error ? error.message : 'No se pudo exportar el archivo.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Image src="/icon.png" alt="Northwind" h={32} w={32} fit="contain" />
            {!isCompactNav ? <Title order={3}>Northwind | Cobranzas</Title> : null}
          </Group>

          <Text c="dimmed" fw={500} size="sm" style={{ whiteSpace: 'nowrap' }}>
            Día de vencimiento: {dueDay ?? '-'}
          </Text>

          <Group gap="xs" wrap="nowrap">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className={({ isActive }) =>
                  [
                    'rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100',
                  ].join(' ')
                }
              >
                {isCompactNav ? (
                  <item.icon size={16} />
                ) : (
                  <>
                    <item.icon
                      size={16}
                      className="mr-1.5 inline-block align-text-bottom"
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}

            <Button
              leftSection={!isCompactNav ? <IconDownload size={16} /> : undefined}
              variant="subtle"
              onClick={() => setIsExportModalOpen(true)}
              aria-label="Exportar"
              px={isCompactNav ? 'sm' : undefined}
            >
              {isCompactNav ? <IconDownload size={16} /> : 'Exportar'}
            </Button>

            <Button
              leftSection={!isCompactNav ? <IconSettings size={16} /> : undefined}
              variant="subtle"
              onClick={openSettings}
              aria-label="Configuración"
              px={isCompactNav ? 'sm' : undefined}
            >
              {isCompactNav ? <IconSettings size={16} /> : 'Configuración'}
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main className="min-h-screen bg-slate-50">
        <Outlet />
      </AppShell.Main>

      <Modal
        opened={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Exportar datos"
        centered
      >
        <Stack gap="md">
          <Text>
            Vas a bajar un Excel con todos los datos de clientes, deuda, pagos.
          </Text>

          {isExporting ? (
            <Text c="dimmed" size="sm">
              Esto podría tardar un momento.
            </Text>
          ) : null}

          {exportErrorMessage ? (
            <Alert color="red">{exportErrorMessage}</Alert>
          ) : null}

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setIsExportModalOpen(false)}
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button loading={isExporting} onClick={handleExportCustomers}>
              Exportar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AppShell>
  )
}
