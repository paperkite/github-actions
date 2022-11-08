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

### `retag-to-head`

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
  retag-dev-to-head:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - uses: paperkite/github-actions/retag-to-head@main
        with:
          tag: dev
          branch: develop

  # Updates the qa tag to the HEAD of develop if it's merged, which then if
  # changed, re-triggers the automated deployment.
  retag-qa-to-head:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - uses: paperkite/github-actions/retag-to-head@main
        with:
          tag: qa
          branch: develop

```

## Workflows

None so far
