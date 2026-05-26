import { AppShell, Button, Group, Image, Text, Title } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconHome, IconSettings, IconUsers } from '@tabler/icons-react'
import { NavLink, Outlet } from 'react-router-dom'

import { routePaths } from '../routes/paths'
import { useInformantSession } from '../session/InformantSession'

const navItems = [
  { icon: IconHome, label: 'Home', to: routePaths.home },
  { icon: IconUsers, label: 'Customers', to: routePaths.customers },
]

export function AppLayout() {
  const { dueDay, openSettings } = useInformantSession()
  const isCompactNav = useMediaQuery('(max-width: 1000px)')

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
    </AppShell>
  )
}
