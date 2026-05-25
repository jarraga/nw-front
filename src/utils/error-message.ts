export const SERVER_NOT_RESPONDING_MESSAGE = 'El servidor no responde'
export const UNEXPECTED_ERROR_MESSAGE = 'Ocurrio un error inesperado.'

export function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return UNEXPECTED_ERROR_MESSAGE
  }

  if (error.message === 'Failed to fetch') {
    return SERVER_NOT_RESPONDING_MESSAGE
  }

  return error.message
}
