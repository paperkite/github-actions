# Paperkite Github Actions shared actions & workflows

A repository for sharing GHA actions & workflows between projects at PK.

## Actions

### `generate-sha`

Allows us to consistently create 1-to-1 image names for our Docker images via providing a consistent SHA. It's simply an action that provides the 8 char SHA of the current commit to be used in qa/dev tags like dev-81db02f5.

### `generate-environment-info`

This looks at the workflow and determines the environment specific information like:

- the name of the environment: `development|QA|UAT|staging|production`
- the rails env: `dev|qa|uat|staging|production`
- the version/tag name to use: e.g. `dev-89dceb2a` or for production builds `v2.7.1`
- the prefix used (for EB environments etc): `dev|qa|uat|staging|prod`

### `deploy-eb-docker-environment`

This handles the whole process of creating the source ZIP and it's files, the version and updates the environment to deploy.

- Creating the source bundle
- Uploading the source bundle to S3
- Creating the EB application version
- Deploying the EB application version to one or many EB environments

### `move-tag-to-head-if-merged`

Automatically moves a tag to the `HEAD` of the current branch if it finds the tag in the history of the current branch. This is used to:

- automatically update the `dev` tag to the `HEAD` of `develop` when the branch it's on is merged
- automatically update the `qa` tag to the `HEAD` of `develop` when a new branch is merged into it

NOTE: You will want to make sure you checkout with `fetch-depth: 0` to get the git history needed to run the operations. Otherwise the refs wont be there for `rev-list` to output and for us to use to detect the tag in the history.

Example usage:

```yaml
name: Automated retagging

on:
  push:
    branches:
      - develop

jobs:

  # Updates the dev tag to the HEAD of develop if it's merged, which then if
  # changed, re-triggers the automated deployment.
  move-dev-tag-to-head-if-merged:
    name: Move dev tag to develop HEAD if merged
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - uses: paperkite/github-actions/move-tag-to-head-if-merged@main
        with:
          tag: dev
          branch: develop

  # Updates the qa tag to the HEAD of develop if it's merged, which then if
  # changed, re-triggers the automated deployment.
  move-qa-tag-to-head-if-merged:
    name: Move qa tag to develop HEAD if merged
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - uses: paperkite/github-actions/move-tag-to-head-if-merged@main
        with:
          tag: qa
          branch: develop

```

### `check-oas-bundled`

This action just checks if the provided source schema is bundled in the target directory and that it's been checked in verison control. This is primarily to prevent drift from people not comitting the schemas and also the RSpec OAS validation happens against the bundled schema, which means uncomittted bundled schemas can break tests on later PRs.

```yaml
jobs:

  check_api_oas_bundled:
    name: Check API OAS is bundled
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: paperkite/github-actions/check-oas-bundled
        with:
          schema: ./docs/api/build/schema.yaml
          source: ./docs/api/schema.yaml
```

### `deploy-ecs-service`

Creates a new ECS Task Definition from the latest revision of a given family with a new image tag, then updates the service to use the new task definition.

Outputs:
- `new_td_revision`: The revision number of the newly created task definition

```yaml
- name: Deploy ECS Service
  id: deploy-service
  uses: paperkite/github-actions/deploy-ecs-service@main
  with:
    region: 'ap-southeast-2'
    access-key: ${{ secrets.AWS_ACCESS_KEY_ID }}
    secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    ecs-cluster-name: 'dev-cluster'
    ecs-service-name: 'api-dev'
    ecs-td-family: 'api-dev'
    ecr-image-url: '123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/bpme-api:latest'
```

### `deploy-ecs-scheduled-tasks`

Updates CloudWatch Event targets for scheduled ECS tasks to use a new task definition. This action should be run after `deploy-ecs-service` to update scheduled tasks with the new task definition created by the service deployment.

The action automatically finds CloudWatch Event rules matching the pattern `{service-name}-{environment}-{task-name}` and updates their targets to use the new task definition while preserving all other configuration.

```yaml
- name: Deploy ECS Scheduled Tasks
  uses: paperkite/github-actions/deploy-ecs-scheduled-tasks@main
  with:
    region: 'ap-southeast-2'
    access-key: ${{ secrets.AWS_ACCESS_KEY_ID }}
    secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    ecs-cluster-name: 'dev-cluster'
    ecs-td-family: 'api-dev'
    ecs-td-revision: ${{ steps.deploy-service.outputs.new_td_revision }}
    service-name: 'api'
    environment: 'dev'
```

Example combined usage:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy ECS Service
        id: deploy-service
        uses: paperkite/github-actions/deploy-ecs-service@main
        with:
          region: 'ap-southeast-2'
          access-key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          ecs-cluster-name: 'dev-cluster'
          ecs-service-name: 'api-dev'
          ecs-td-family: 'api-dev'
          ecr-image-url: '${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.ap-southeast-2.amazonaws.com/bpme-api:${{ github.sha }}'

      - name: Deploy ECS Scheduled Tasks
        uses: paperkite/github-actions/deploy-ecs-scheduled-tasks@main
        with:
          region: 'ap-southeast-2'
          access-key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          ecs-cluster-name: 'dev-cluster'
          ecs-td-family: 'api-dev'
          ecs-td-revision: ${{ steps.deploy-service.outputs.new_td_revision }}
          service-name: 'api'
          environment: 'dev'
```

## Workflows

### `bitrise-pipeline`

Starts a Bitrise pipeline and waits for it to finish, failing the job if the
pipeline does. Use it wherever a repo's mobile build or distribution runs on
Bitrise rather than on a runner.

The calling repo supplies the app and credentials, so nothing here is
project-specific:

| Where | Name | Purpose |
|-------|------|---------|
| Variable | `BITRISE_APP_SLUG` | The Bitrise app to build |
| Secret | `BITRISE_API_TOKEN` | A Bitrise personal access token |

Both are read from the calling job, so pass `secrets: inherit`. Set them per
GitHub Environment when they differ between environments, and pass that
environment's name as the `environment` input — the job runs under it, which is
what scopes the variable and secret.

#### Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `pipeline` | yes | The Bitrise pipeline to start |
| `tag` | no | Deploy tag, when triggered by one |
| `branch` | no | Branch to build, when not triggered by a tag |
| `commit` | no | Commit to build. Defaults to `github.sha` |
| `environment` | no | GitHub environment to run under, if any |

Give it a `tag` **or** a `branch` — a tag for a deploy, a branch for a build off
a pull request. The commit message is taken from the triggering event and shown
on the Bitrise build.

The pipeline is polled every 15 seconds and the job gives up after 30 minutes.

#### Example usage

Distributing on a deploy tag, under a GitHub environment:

```yaml
jobs:
  deploy-mobile:
    name: Distribute mobile app
    needs:
      - configuration
    uses: paperkite/github-actions/.github/workflows/bitrise-pipeline.yaml@main
    with:
      pipeline: ${{ needs.configuration.outputs.mobile_pipeline }}
      tag: ${{ github.ref_name }}
      environment: ${{ needs.configuration.outputs.environment }}
    secrets: inherit
```

Building a pull request:

```yaml
jobs:
  build:
    name: Mobile build
    uses: paperkite/github-actions/.github/workflows/bitrise-pipeline.yaml@main
    with:
      pipeline: build
      branch: ${{ github.head_ref }}
      commit: ${{ github.event.pull_request.head.sha }}
    secrets: inherit
```
