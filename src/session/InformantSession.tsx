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
const USER_ID_STORAGE_KEY = 'userID'

type InformantSession = {
  userID: string
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

function createUserID() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readOrCreateUserID() {
  const storedUserID = localStorage.getItem(USER_ID_STORAGE_KEY)?.trim()

  if (storedUserID) {
    return storedUserID
  }

  const userID = createUserID()
  localStorage.setItem(USER_ID_STORAGE_KEY, userID)

  return userID
}

export function useInformantSession() {
  const session = useContext(InformantSessionContext)

  if (!session) {
    throw new Error('useInformantSession must be used within InformantSessionProvider')
  }

  return session
}

export function InformantSessionProvider({ children }: { children: ReactNode }) {
  const [userID] = useState(readOrCreateUserID)
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
      userID,
      informantName,
      dueDay,
    }),
    [dueDay, informantName, userID],
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
