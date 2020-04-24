import * as core from '@actions/core'

export function printDebug(message: string, obj?: any): void {
  if (obj) {
    core.debug(`${message}: ${JSON.stringify(obj)}`)
  } else {
    core.debug(`${message}`)
  }
}
