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

## Workflows

None so far
