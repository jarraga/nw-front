import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react'
import { Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core'

const INFORMANT_NAME_STORAGE_KEY = 'informantName'
const DUE_DAY_STORAGE_KEY = 'dueDay'
const USER_ID_STORAGE_KEY = 'userID'

type InformantSession = {
  userID: string
  informantName: string
  dueDay: number | null
  openSettings: () => void
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
  const [informantName, setInformantName] = useState(readStoredInformantName)
  const [dueDay, setDueDay] = useState<number | null>(readStoredDueDay)
  const [draftInformantName, setDraftInformantName] = useState(
    readStoredInformantName,
  )
  const [draftDueDay, setDraftDueDay] = useState<string | null>(() => {
    const storedDueDay = readStoredDueDay()

    return storedDueDay?.toString() ?? null
  })
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const shouldAskForSessionData = informantName.trim() === '' || dueDay === null

  const session = useMemo(
    () => ({
      userID,
      informantName,
      dueDay,
      openSettings: () => {
        setDraftInformantName(informantName)
        setDraftDueDay(dueDay?.toString() ?? null)
        setIsSettingsModalOpen(true)
      },
    }),
    [dueDay, informantName, userID],
  )

  function handleSave() {
    const nextInformantName = draftInformantName.trim()
    const nextDueDay = draftDueDay ? Number(draftDueDay) : NaN

    if (!nextInformantName || !Number.isFinite(nextDueDay)) {
      return
    }

    localStorage.setItem(INFORMANT_NAME_STORAGE_KEY, nextInformantName)
    localStorage.setItem(DUE_DAY_STORAGE_KEY, nextDueDay.toString())
    setInformantName(nextInformantName)
    setDueDay(nextDueDay)
    setIsSettingsModalOpen(false)
  }

  function handleSettingsClose() {
    if (shouldAskForSessionData) {
      return
    }

    setIsSettingsModalOpen(false)
  }

  return (
    <InformantSessionContext.Provider value={session}>
      {children}

      <Modal
        opened={shouldAskForSessionData || isSettingsModalOpen}
        onClose={handleSettingsClose}
        title="Configuración"
        centered
        closeOnClickOutside={!shouldAskForSessionData}
        closeOnEscape={!shouldAskForSessionData}
        withCloseButton={!shouldAskForSessionData}
      >
        <Stack gap="md">
          <TextInput
            label="Nombre"
            value={draftInformantName}
            onChange={(event) => setDraftInformantName(event.currentTarget.value)}
            required
          />

          <Select
            label="Día de vencimiento"
            value={draftDueDay}
            onChange={setDraftDueDay}
            data={Array.from({ length: 30 }, (_, index) => {
              const value = (index + 1).toString()

              return { value, label: value }
            })}
            allowDeselect={false}
            required
          />

          <Group justify="flex-end">
            <Button
              onClick={handleSave}
              disabled={draftInformantName.trim() === '' || draftDueDay === null}
            >
              Guardar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </InformantSessionContext.Provider>
  )
}
