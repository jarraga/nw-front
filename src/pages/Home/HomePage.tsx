import { Container, Paper, Text, Title } from '@mantine/core'

export function HomePage() {
  return (
    <Container size="lg" py="xl">
      <Paper withBorder radius="md" p="xl" className="bg-white">
        <Title order={1}>Hello world</Title>
        <Text mt="sm" c="dimmed">
          Proyecto base listo para empezar.
        </Text>
      </Paper>
    </Container>
  )
}
