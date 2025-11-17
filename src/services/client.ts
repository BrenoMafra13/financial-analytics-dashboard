interface SimulateOptions<T> {
  data: T
  delayMs?: number
  shouldFail?: boolean
  errorMessage?: string
}

export async function simulateRequest<T>({
  data,
  delayMs = 450,
  shouldFail = false,
  errorMessage = 'Unable to fetch data',
}: SimulateOptions<T>): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, delayMs))

  if (shouldFail) {
    throw new Error(errorMessage)
  }

  return data
}
