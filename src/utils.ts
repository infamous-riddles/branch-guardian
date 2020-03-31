import * as core from '@actions/core'

export function printDebug(message: string = '', obj: any): void {
  core.debug(`${message}: ${JSON.stringify(obj)}`)
}
