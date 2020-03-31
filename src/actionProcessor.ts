import * as core from '@actions/core'
import {printDebug} from './utils'
import {ActionConstants} from './constants'
import {GithubRepo} from './githubRepo'

export class ActionProcessor {
  private githubRepo: GithubRepo
  private baseBranchPattern: string = core.getInput(
    ActionConstants.BASE_BRANCH_PATTERN_INPUT_KEY,
    {required: true}
  )
  private branchPatternRegex: RegExp = new RegExp(this.baseBranchPattern)

  constructor(githubRepo: GithubRepo) {
    this.githubRepo = githubRepo
  }

  async processAction(
    currentBranch: string,
    refType: string,
    eventName: string
  ): Promise<void> {
    let matchesPattern = this.branchPatternRegex.test(currentBranch)

    printDebug(
      `Pattern for branch matches branch: ${currentBranch}`,
      this.branchPatternRegex.test(currentBranch)
    )

    if (!matchesPattern) {
      printDebug(
        `Branch: ${currentBranch} does not match pattern:`,
        this.baseBranchPattern
      )
      return Promise.resolve()
    }

    if (refType !== ActionConstants.BRANCH_REF_TYPE) {
      return Promise.resolve()
    }

    if (eventName === ActionConstants.CREATE_EVENT_NAME) {
      return this.githubRepo.createBranchRule()
    } else if (eventName == ActionConstants.DELETE_EVENT_NAME) {
      return this.githubRepo.deleteBranchRule()
    }
  }
}
