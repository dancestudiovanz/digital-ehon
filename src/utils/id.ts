export const createId = () =>
  `${crypto.randomUUID()}-${Math.random().toString(36).slice(2, 8)}`
