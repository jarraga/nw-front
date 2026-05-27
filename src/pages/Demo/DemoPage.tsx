import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Button,
  Container,
  FileInput,
  Group,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconDatabaseImport,
  IconDatabaseOff,
  IconFileSpreadsheet,
  IconRefresh,
} from '@tabler/icons-react'

import { API_URL } from '../../config/api'
import { routePaths } from '../../routes/paths'

const RESET_DATA_URL = `${API_URL}/admin/reset-data`
const RESET_DEMO_DATA_URL = `${API_URL}/admin/reset-demo-data`
const IMPORT_XLS_URL = `${API_URL}/admin/import-xls`
const REDIRECT_DELAY_MS = 3000

type DemoActionID = 'reset' | 'demo' | 'import'

type DemoAction = {
  id: DemoActionID
  title: string
  description: string
  confirmText: string
  buttonLabel: string
  endpoint: string
  icon: typeof IconDatabaseOff
}

const demoActions: DemoAction[] = [
  {
    id: 'reset',
    title: 'Limpiar base de datos',
    description: 'Borra todos los registros y deja la base lista para usar.',
    confirmText: 'Todos los datos actuales se van a borrar.',
    buttonLabel: 'Limpiar base',
    endpoint: RESET_DATA_URL,
    icon: IconDatabaseOff,
  },
  {
    id: 'demo',
    title: 'Limpiar y generar datos fakes',
    description: 'Reinicia la base y carga un set nuevo de datos demo.',
    confirmText: 'Todos los datos actuales se van a borrar y se cargaran datos demo.',
    buttonLabel: 'Generar demo',
    endpoint: RESET_DEMO_DATA_URL,
    icon: IconRefresh,
  },
  {
    id: 'import',
    title: 'Limpiar e importar Excel',
    description: 'Borra todo e importa clientes y pagos desde un archivo .xlsx.',
    confirmText: 'Todos los datos actuales se van a borrar y se importara el Excel.',
    buttonLabel: 'Importar Excel',
    endpoint: IMPORT_XLS_URL,
    icon: IconFileSpreadsheet,
  },
]

async function getResponseErrorMessage(response: Response, fallback: string) {
  const contentType = response.headers.get('Content-Type') ?? ''

  if (contentType.includes('application/json')) {
    const data = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null

    if (typeof data?.message === 'string') {
      return data.message
    }

    if (typeof data?.error === 'string') {
      return data.error
    }
  }

  const text = await response.text().catch(() => '')

  return text.trim() || fallback
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function DemoPage() {
  const navigate = useNavigate()
  const [selectedAction, setSelectedAction] = useState<DemoAction | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(3)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const canSubmit = secondsLeft === 0

  useEffect(() => {
    if (!selectedAction) {
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
  }, [selectedAction, secondsLeft])

  function handleOpenModal(action: DemoAction) {
    setSelectedAction(action)
  }

  function handleCloseModal() {
    if (isSubmitting) {
      return
    }

    setSelectedAction(null)
  }

  async function handleSubmitAction() {
    if (!selectedAction) {
      return
    }

    if (selectedAction.id === 'import' && !file) {
      setErrorMessage('Selecciona un archivo .xlsx para importar.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage('')

      const body =
        selectedAction.id === 'import' && file
          ? (() => {
              const formData = new FormData()
              formData.append('file', file)
              return formData
            })()
          : undefined

      const response = await fetch(selectedAction.endpoint, {
        body,
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(
            response,
            'No se pudo completar la operacion.',
          ),
        )
      }

      const data = (await response.json()) as {
        ok?: boolean
        customersCreated?: number
        paymentsCreated?: number
      }

      if (selectedAction.id !== 'import' && !data.ok) {
        throw new Error('El backend no confirmo la operacion.')
      }

      await wait(REDIRECT_DELAY_MS)
      navigate(routePaths.customers)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo completar la operacion.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container size="md" py="xl">
      <Paper withBorder radius="md" p="xl" className="bg-white">
        <Stack gap="xl">
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="light">
              <IconDatabaseImport size={20} />
            </ThemeIcon>
            <div>
              <Title order={1}>Demo data</Title>
              <Text c="dimmed" mt={4}>
                Herramientas para reiniciar, generar o importar datos de prueba.
              </Text>
            </div>
          </Group>

          <Alert color="gray" variant="light">
            Estas acciones borran datos existentes. Usalas solo en entornos de demo.
          </Alert>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            {demoActions.map((action) => {
              const ActionIcon = action.icon
              const isImportAction = action.id === 'import'

              return (
                <Paper key={action.id} withBorder radius="md" p="md">
                  <Stack gap="md" h="100%">
                    <Group gap="sm" align="flex-start">
                      <ThemeIcon variant="light" radius="md">
                        <ActionIcon size={18} />
                      </ThemeIcon>
                      <div>
                        <Text fw={700}>{action.title}</Text>
                        <Text c="dimmed" size="sm" mt={4}>
                          {action.description}
                        </Text>
                      </div>
                    </Group>

                    {isImportAction ? (
                      <FileInput
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        clearable
                        label="Archivo Excel"
                        placeholder="Seleccionar .xlsx"
                        value={file}
                        onChange={setFile}
                      />
                    ) : null}

                    <Group justify="flex-end" mt="auto">
                      <Button
                        variant={isImportAction ? 'filled' : 'light'}
                        onClick={() => handleOpenModal(action)}
                        disabled={isSubmitting || (isImportAction && !file)}
                      >
                        {action.buttonLabel}
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              )
            })}
          </SimpleGrid>
        </Stack>
      </Paper>

      <Modal
        opened={selectedAction !== null}
        onClose={handleCloseModal}
        title={selectedAction?.title ?? 'Confirmar accion'}
        centered
      >
        <Stack gap="md">
          <Alert color="red" variant="light" title="Confirmar accion">
            {selectedAction?.confirmText}
          </Alert>

          {isSubmitting ? (
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
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              color="red"
              disabled={!canSubmit}
              loading={isSubmitting}
              onClick={handleSubmitAction}
            >
              {canSubmit
                ? selectedAction?.buttonLabel
                : `${selectedAction?.buttonLabel ?? 'Confirmar'} (${secondsLeft})`}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
