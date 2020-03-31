import * as core from '@actions/core'
import * as github from '@actions/github'

const BASE_BRANCH_PATTERN_INPUT_KEY = 'base-branch-pattern'
const PERSONAL_ACCESS_TOKEN_KEY = 'personal-access-token'

// Event names
const CREATE_EVENT_NAME = "create"
const DELETE_EVENT_NAME = "delete"
const PULL_REQUEST_NAME = "pull_request"

// Ref type
const BRANCH_REF_TYPE = "branch"

// Github action types
const PR_CLOSED = "closed"

async function run(): Promise<void> {
  const baseBranchPattern: string = core.getInput(BASE_BRANCH_PATTERN_INPUT_KEY, { required: true })
  const personalAccessToken: string = core.getInput(PERSONAL_ACCESS_TOKEN_KEY, { required: true })

  const octokit = new github.GitHub(personalAccessToken)

  const githubContext = github.context
  const currentOwner = githubContext.payload.repository!.owner.login
  const currentRepo = githubContext.payload.repository!.name
  const currentBranch = githubContext.payload.ref
  const eventName = githubContext.eventName
  const refType = githubContext.payload.ref_type

  printDebug('Current branch', currentBranch)
  printDebug('Github context', githubContext)
  printDebug('Event name', eventName)
  printDebug('Ref type', refType)

  if (eventName === PULL_REQUEST_NAME) {
    const isMerged = githubContext.payload.pull_request!.merged == true
    printDebug('Pull request was merged', githubContext.payload.pull_request!)
    return Promise.resolve()
  }

  if (refType !== BRANCH_REF_TYPE) {
    return Promise.resolve()
  }

  if (eventName === CREATE_EVENT_NAME) {
    const branchProtection = await octokit.repos.getBranchProtection({
      owner: currentOwner,
      repo: currentRepo,
      branch: currentBranch,
    }).catch(async (reason) => {
      if (reason.name === "HttpError" && reason.status === 404) {
        const updateProtection = await octokit.repos.updateBranchProtection({
          owner: currentOwner,
          repo: currentRepo,
          branch: currentBranch,
          required_status_checks: null,
          enforce_admins: null,
          required_pull_request_reviews: { required_approving_review_count: 2 },
          restrictions: null,
          mediaType: { previews: ["luke-cage"] }
        })

        printDebug('Updated protection', updateProtection)
      }
    })
  } else if (eventName == DELETE_EVENT_NAME) {
    printDebug('Is delete event', eventName)
    octokit.repos.removeBranchProtection({
      owner: currentOwner,
      repo: currentRepo,
      branch: currentBranch,
    }).then((deletedProtection) => {
      printDebug(`Successfully deleted branch protection for ${currentBranch}`, deletedProtection)
    })
  }

  // core.debug(`Branch protection ${JSON.stringify(branchProtection)}`)

  core.debug(`Read the following pattern ${baseBranchPattern}`)
  core.setOutput('base-branch-pattern', baseBranchPattern)
}

function printDebug(message: string = '', obj: any): void {
  core.debug(`${message}: ${JSON.stringify(obj)}`)
}

run()
