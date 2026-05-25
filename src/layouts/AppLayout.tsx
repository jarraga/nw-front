import { AppShell, Group, Title } from '@mantine/core'
import { NavLink, Outlet } from 'react-router-dom'

import { routePaths } from '../routes/paths'

const navItems = [
  { label: 'Home', to: routePaths.home },
  { label: 'Customers', to: routePaths.customers },
]

export function AppLayout() {
  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3}>NW Front</Title>

          <Group gap="xs">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main className="min-h-screen bg-slate-50">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
