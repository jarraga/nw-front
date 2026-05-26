import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Button,
  Center,
  Container,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconDatabaseImport, IconRefresh } from '@tabler/icons-react'

import { API_URL } from '../../config/api'
import { routePaths } from '../../routes/paths'
import { getErrorMessage } from '../../utils/error-message'

const RESET_DEMO_DATA_URL = `${API_URL}/admin/reset-demo-data`

export function DemoPage() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(3)
  const [isResetting, setIsResetting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const canReset = secondsLeft === 0

  useEffect(() => {
    if (!isModalOpen) {
      setSecondsLeft(3)
      setErrorMessage('')
      return
    }

    if (secondsLeft === 0) {
      return
    }

    const timeoutID = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => window.clearTimeout(timeoutID)
  }, [isModalOpen, secondsLeft])

  function handleOpenModal() {
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    if (isResetting) {
      return
    }

    setIsModalOpen(false)
  }

  async function handleResetDemoData() {
    try {
      setIsResetting(true)
      setErrorMessage('')

      const response = await fetch(RESET_DEMO_DATA_URL, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('No se pudieron reiniciar los datos de la demo.')
      }

      const data = (await response.json()) as { ok?: boolean }

      if (!data.ok) {
        throw new Error('La demo no confirmó el reinicio de datos.')
      }

      navigate(routePaths.customers)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Container size="sm" py="xl">
      <Center>
        <Paper withBorder radius="md" p="xl" className="bg-white" w="100%">
          <Stack gap="lg">
            <Group gap="sm">
              <ThemeIcon size="lg" radius="md" variant="light">
                <IconDatabaseImport size={20} />
              </ThemeIcon>
              <div>
                <Title order={1}>Demo data</Title>
                <Text c="dimmed" mt={4}>
                  Reiniciá la demo y cargá un set nuevo de datos de prueba.
                </Text>
              </div>
            </Group>

            <Alert color="gray" variant="light">
              Esta acción está pensada solo para entornos de demostración.
            </Alert>

            <Group justify="flex-end">
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={handleOpenModal}
              >
                Reiniciar datos de la demo
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Center>

      <Modal
        opened={isModalOpen}
        onClose={handleCloseModal}
        title="Reiniciar datos de la demo"
        centered
      >
        <Stack gap="md">
          <Alert color="red" variant="light" title="Confirmar reinicio">
            Todos los datos actuales se van a borrar y se cargarán datos nuevos.
          </Alert>

          {isResetting ? (
            <Text c="dimmed" size="sm">
              Esto puede tardar un momento.
            </Text>
          ) : null}

          {errorMessage ? (
            <Alert color="red" variant="light">
              {errorMessage}
            </Alert>
          ) : null}

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={handleCloseModal}
              disabled={isResetting}
            >
              Cancelar
            </Button>
            <Button
              color="red"
              disabled={!canReset}
              loading={isResetting}
              onClick={handleResetDemoData}
            >
              {canReset ? 'Reiniciar demo' : `Reiniciar demo (${secondsLeft})`}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
