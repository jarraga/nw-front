import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core'

const INFORMANT_NAME_STORAGE_KEY = 'informantName'
const DUE_DAY_STORAGE_KEY = 'dueDay'

type InformantSession = {
  informantName: string
  dueDay: number | null
}

const InformantSessionContext = createContext<InformantSession | null>(null)

function readStoredInformantName() {
  return localStorage.getItem(INFORMANT_NAME_STORAGE_KEY)?.trim() ?? ''
}

function readStoredDueDay() {
  const storedDueDay = localStorage.getItem(DUE_DAY_STORAGE_KEY)
  const parsedDueDay = storedDueDay ? Number(storedDueDay) : NaN

  return Number.isFinite(parsedDueDay) ? parsedDueDay : null
}

export function useInformantSession() {
  const session = useContext(InformantSessionContext)

  if (!session) {
    throw new Error('useInformantSession must be used within InformantSessionProvider')
  }

  return session
}

export function InformantSessionProvider({ children }: { children: ReactNode }) {
  const [informantName, setInformantName] = useState('')
  const [dueDay, setDueDay] = useState<number | null>(null)
  const [draftInformantName, setDraftInformantName] = useState('')
  const shouldAskForInformantName = informantName.trim() === ''

  useEffect(() => {
    const storedInformantName = readStoredInformantName()
    const storedDueDay = readStoredDueDay()

    setInformantName(storedInformantName)
    setDueDay(storedDueDay)
    setDraftInformantName(storedInformantName)
  }, [])

  const session = useMemo(
    () => ({
      informantName,
      dueDay,
    }),
    [dueDay, informantName],
  )

  function handleSave() {
    const nextInformantName = draftInformantName.trim()

    if (!nextInformantName) {
      return
    }

    localStorage.setItem(INFORMANT_NAME_STORAGE_KEY, nextInformantName)
    setInformantName(nextInformantName)
  }

  return (
    <InformantSessionContext.Provider value={session}>
      {children}

      <Modal
        opened={shouldAskForInformantName}
        onClose={() => undefined}
        title="Datos del informante"
        centered
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
      >
        <Stack gap="md">
          <TextInput
            label="Nombre"
            value={draftInformantName}
            onChange={(event) => setDraftInformantName(event.currentTarget.value)}
            required
          />

          <Group justify="flex-end">
            <Button
              onClick={handleSave}
              disabled={draftInformantName.trim() === ''}
            >
              Guardar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </InformantSessionContext.Provider>
  )
}
