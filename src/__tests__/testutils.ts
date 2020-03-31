export function mockInput(key: string, value: string): void {
  process.env[`INPUT_${key}`] = value
}
