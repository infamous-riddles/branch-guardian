import {v4 as uuidv4} from 'uuid'

export class GraphQLQueryBuilders {
  static buildBranchProtectionRuleQuery(
    rulesLimit: number,
    owner: string,
    repo: string
  ): string {
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

  static buildBranchProtectionRuleDeleteMutation(
    branchProtectionRuleId: string
  ): string {
    return `
        mutation {
          deleteBranchProtectionRule(input: {clientMutationId: "${uuidv4()}", branchProtectionRuleId: "${branchProtectionRuleId}"}) {
            clientMutationId
          }
        }
        `
  }
}
