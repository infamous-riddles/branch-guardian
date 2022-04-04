import * as github from '@actions/github'
import {printDebug} from './utils'
import {RealGithubRepo} from './github_repo'
import {ActionProcessor} from './action_processor'

async function run(): Promise<void> {
  const githubContext = github.context
  const currentOwner = githubContext.payload.repository!.owner.login
  const currentRepo = githubContext.payload.repository!.name
  const currentBranch = githubContext.payload.ref
  const eventName = githubContext.eventName
  const refType = githubContext.payload.ref_type

  printDebug('Current branch', currentBranch)
  printDebug('Event name', eventName)
  printDebug('Ref type', refType)

  const githubRepo = new RealGithubRepo(
    currentOwner,
    currentRepo,
    currentBranch
  )
  const actionProcessor = new ActionProcessor(githubRepo)

  actionProcessor.processAction(currentBranch, refType, eventName)
}

run()
