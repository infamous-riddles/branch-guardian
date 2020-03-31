import {GithubRepo} from '../githubRepo'

export class FakeGithubRepo extends GithubRepo {
  async createBranchRule(): Promise<void> {
    return Promise.resolve()
  }
  async deleteBranchRule(): Promise<void> {
    return Promise.resolve()
  }
}
