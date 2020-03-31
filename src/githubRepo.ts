import * as core from '@actions/core'
import * as github from '@actions/github'
import {graphql} from '@octokit/graphql'
import {ActionConstants} from './constants'
import {printDebug} from './utils'
import {GraphQLQueryBuilders} from './graphQLQueryBuilders'

export abstract class GithubRepo {
  readonly owner: string
  readonly repo: string
  readonly branch: string

  constructor(owner: string, repo: string, branch: string) {
    this.owner = owner
    this.repo = repo
    this.branch = branch
  }

  abstract async createBranchRule(): Promise<void>
  abstract async deleteBranchRule(): Promise<void>
}

export class RealGithubRepo extends GithubRepo {
  private personalAccessToken: string = core.getInput(
    ActionConstants.PERSONAL_ACCESS_TOKEN_KEY,
    {required: true}
  )
  private rulesLimit: number = parseInt(
    core.getInput(ActionConstants.RULES_LIMIT_INPUT_KEY)
  )
  private requiredNumberOfReviewers = parseInt(
    core.getInput(ActionConstants.REQUIRED_NUMBER_OF_REVIEWERS)
  )
  private requireReviewFromCodeowners = core.getInput(
    ActionConstants.REQUIRE_REVIEW_FROM_CODEOWNERS
  )
  private requiredStatusChecks = core.getInput(
    ActionConstants.REQUIRED_STATUS_CHECKS
  )

  private sanitizedStatusChecks = !this.requiredStatusChecks
    ? null
    : {
        contexts: this.requiredStatusChecks
          .split(',')
          .map(statusCheck => statusCheck.trim()),
        strict: true
      }

  private authedGraphQL = graphql.defaults({
    headers: {
      authorization: `${ActionConstants.GRAPHQL_AUTH_TOKEN_PREFIX} ${this.personalAccessToken}`
    }
  })

  private octokit = new github.GitHub(this.personalAccessToken)

  async createBranchRule(): Promise<void> {
    const updateProtection = await this.octokit.repos.updateBranchProtection({
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
      required_status_checks: this.sanitizedStatusChecks,
      enforce_admins: null,
      required_pull_request_reviews: {
        required_approving_review_count: this.requiredNumberOfReviewers,
        require_code_owner_reviews: this.requireReviewFromCodeowners == 'true'
      },
      restrictions: null,
      allow_deletions: true,
      mediaType: {previews: ActionConstants.GRAPHQL_MEDIATYPE_PREVIEWS}
    })

    printDebug('Updated protection', updateProtection)

    if (!updateProtection) {
      printDebug(
        `Could not create rules for branch: ${this.branch}`,
        updateProtection
      )
    }

    return Promise.resolve()
  }

  async deleteBranchRule(): Promise<void> {
    const branchProtectionRulesResponse = await this.authedGraphQL(
      GraphQLQueryBuilders.buildBranchProtectionRuleQuery(
        this.rulesLimit,
        this.owner,
        this.repo
      )
    )

    if (!branchProtectionRulesResponse) {
      printDebug(
        `Rules were null for ${this.branch}`,
        branchProtectionRulesResponse
      )
      return Promise.resolve()
    }

    printDebug(
      `Branch protection rules response`,
      branchProtectionRulesResponse
    )

    const rule = branchProtectionRulesResponse.repository.branchProtectionRules.edges.find(
      (edge: {node: {id: string; pattern: string}}) =>
        edge.node.pattern == this.branch
    )

    if (!rule) {
      printDebug(`Rule was not found in rules`, branchProtectionRulesResponse)
      return Promise.resolve()
    }

    const branchProtectionRuleMutation = await this.authedGraphQL(
      GraphQLQueryBuilders.buildBranchProtectionRuleDeleteMutation(rule.node.id)
    )

    printDebug(
      `Branch protection rule delete mutation`,
      branchProtectionRuleMutation
    )

    return Promise.resolve()
  }
}
