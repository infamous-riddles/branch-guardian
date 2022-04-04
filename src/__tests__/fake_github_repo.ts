import {GithubRepo} from '../github_repo'

export class FakeGithubRepo extends GithubRepo {
  async createBranchRule(): Promise<void> {
    return Promise.resolve()
  }
  async deleteBranchRule(): Promise<void> {
    return Promise.resolve()
  }
}
