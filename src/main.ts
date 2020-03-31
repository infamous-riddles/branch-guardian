import * as core from '@actions/core'
import * as github from '@actions/github'
import { graphql } from '@octokit/graphql'
import { v4 as uuidv4 } from 'uuid'

const BASE_BRANCH_PATTERN_INPUT_KEY = 'base-branch-pattern'
const PERSONAL_ACCESS_TOKEN_KEY = 'personal-access-token'
const RULES_LIMIT_INPUT_KEY = "rules-limit"

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
  const rulesLimit: number = parseInt(core.getInput(RULES_LIMIT_INPUT_KEY))

  const authedGraphQL = graphql.defaults({
    headers: {
      authorization: `token ${personalAccessToken}`
    }
  })

  const octokit = new github.GitHub(personalAccessToken)

  const githubContext = github.context
  const currentOwner = githubContext.payload.repository!.owner.login
  const currentRepo = githubContext.payload.repository!.name
  const currentBranch = githubContext.payload.ref
  const eventName = githubContext.eventName
  const refType = githubContext.payload.ref_type

  printDebug('Current branch', currentBranch)
  printDebug('Event name', eventName)
  printDebug('Ref type', refType)

  if (eventName === PULL_REQUEST_NAME) {
    const isMerged = githubContext.payload.pull_request!.merged == true
    printDebug('Pull request was merged', isMerged)
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
          allow_deletions: true,
          mediaType: { previews: ["luke-cage"] }
        })

        printDebug('Updated protection', updateProtection)
      }
    })
  } else if (eventName == DELETE_EVENT_NAME) {
    const branchProtectionRulesResponse = await authedGraphQL(buildBranchProtectionRuleQuery(rulesLimit, currentOwner, currentRepo))

    if (!branchProtectionRulesResponse) {
      printDebug(`Rules were null for ${currentBranch}`, branchProtectionRulesResponse)
      return Promise.resolve()
    }

    printDebug(`Branch protection rules response`, branchProtectionRulesResponse)
    printDebug(`Repository in branch protection rules found`, branchProtectionRulesResponse.repository)
    printDebug(`Branch protection rules`, branchProtectionRulesResponse.repository.branchProtectionRules)
    printDebug(`Edges in rules`, branchProtectionRulesResponse.repository.branchProtectionRules.edges)

    const rule = branchProtectionRulesResponse
      .repository
      .branchProtectionRules
      .edges
      .find((edge: { node: { id: string; pattern: string; } }) => edge.node.pattern == currentBranch)

    if (!rule) {
      printDebug(`Rule was not found in rules`, branchProtectionRulesResponse)
      return Promise.resolve()
    }

    const branchProtectionRuleMutation = await authedGraphQL(buildBranchProtectionRuleDeleteMutation(rule.node.id))

    printDebug(`Branch protection rule delete mutation`, branchProtectionRuleMutation)
    printDebug('Is delete event', eventName)
  }

  // core.debug(`Branch protection ${JSON.stringify(branchProtection)}`)

  core.debug(`Read the following pattern ${baseBranchPattern}`)
  core.setOutput('base-branch-pattern', baseBranchPattern)
}

function printDebug(message: string = '', obj: any): void {
  core.debug(`${message}: ${JSON.stringify(obj)}`)
}

function buildBranchProtectionRuleQuery(rulesLimit: number, owner: string, repo: string): string {
  return `
  { 
    repository(owner:"${owner}", name:"${repo}") {
      branchProtectionRules(first:${rulesLimit}) {
        edges {
          node {
            id
            pattern
          }
        }
      }
    }
  }
  `
}

function buildBranchProtectionRuleDeleteMutation(branchProtectionRuleId: string): string {
  return `
  mutation {
    deleteBranchProtectionRule(input: {clientMutationId: "${uuidv4()}", branchProtectionRuleId: "${branchProtectionRuleId}"}) {
      clientMutationId
    }
  }
  `
}

run()
