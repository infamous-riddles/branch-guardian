## Automated Branch Protection Rules Creation/Deletion

![Build & Check action's code](https://github.com/infamous-riddles/branch-guardian/workflows/Build%20&%20Check%20action's%20code/badge.svg)

This Github action automates the creation of branch protection rules. It can also hand branch protection rule deletion as well.

In order to use the action, you need to generate a new personal access token from your Account's settings. This is needed because the default Github token provided for Github actions, does not have the required permissions to create/delete branch protection rules.

The idea for creating the Action, was generated due to the way we work. We usually branch-off from `develop` or `master`, in order to start building our new features and usually the base feature branch is following the pattern: `feature/feature-name`. Above this branch we start building the sub-features and in order to ensure the quality of our code and prevent some mistakes, we use branch
protection rules on the main `feature` branch.

## Setup

1. Generate [personal access token](https://github.com/settings/tokens).

    We suggest to use it with GitHub's secrets! To do that go on your project's settings under `Secrets`, add a `PERSONAL_ACCESS_TOKEN` with the token you just created! We will use it later on!

2. Choose desired action to run (e.g.: create and/or delete)

    **Create**

      | Key | Description |
      |:-------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------|
      | `PERSONAL-ACCESS-TOKEN` | Personal access token to create/delete branch protection rules |
      | `REQUIRED-NUMBER-OF-REVIEWERS` | The number of required reviewers when creating a branch protection rule. Defaults to `1`. |
      | `REQUIRED-STATUS-CHECKS` | The status check that need to be successful before a PR can be merged. |
      | `REQUIRE-REVIEW-FROM-CODEOWNERS` | Set to true if you need to require an approved review in pull requests including files with a designated code owner. Defaults to `false`. |

      A sample of rule branch creation can be found [here](.github/workflows/create.yml).

    **Delete**

      | Key | Description |
      |---------------------|------------------------------------------------------------------------------------------------|
      | `PERSONAL-ACCESS-TOKEN` | Personal access token to create/delete branch protection rules |
      | `RULES-LIMIT` | The number of branch protection rules to check in order to find and delete. Defaults to `100`. |

      A sample of rule branch deletion can be found [here](.github/workflows/delete.yml).

3. Specify the **desired branch pattern** that you want to use!

    The key for the pattern of the base branch is `BASE-BRANCH-PATTERN`.

    For example:
    ```ruby
    BASE-BRANCH-PATTERN: '^feature\/[a-zA-Z0-9]+$'
    ```
