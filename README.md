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

## Workflows

None so far
