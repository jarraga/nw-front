import { Avatar, Group, Tooltip } from '@mantine/core'

import type { CustomerViewer } from './CustomerViewers'

const avatarColors = ['blue', 'red', 'green', 'yellow'] as const

function getInitials(name: string) {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return '?'
  }

  return normalizedName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function getAvatarColor(userID: string) {
  const hash = Array.from(userID).reduce(
    (acc, character) => acc + character.charCodeAt(0),
    0,
  )

  return avatarColors[hash % avatarColors.length]
}

export function CustomerViewersAvatars({
  justify = 'flex-start',
  viewers,
}: {
  justify?: 'center' | 'flex-start'
  viewers: CustomerViewer[]
}) {
  if (viewers.length === 0) {
    return null
  }

  return (
    <Group gap={4} justify={justify} wrap="nowrap">
      {viewers.map((viewer) => (
        <Tooltip
          key={viewer.userID}
          label={`${viewer.informantName} está viendo esta página`}
          withArrow
        >
          <Avatar
            radius="xl"
            size="sm"
            color={getAvatarColor(viewer.userID)}
            variant="filled"
          >
            {getInitials(viewer.informantName)}
          </Avatar>
        </Tooltip>
      ))}
    </Group>
  )
}
