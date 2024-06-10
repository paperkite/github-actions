module.exports = ({ github, context }) => {
  // 1. Retrieve existing bot comments for the PR
  const { data: comments } = await github.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
  })

  const botComment = comments.find(comment =>
    comment.user.type === 'Bot' && comment.body.includes('Terraform Format and Style')
  )

  // 2. Prepare format of the comment
  const output = `
#### Terraform Format and Style 🖌\`${steps.fmt.outcome}\`
#### Terraform Initialization ⚙️\`${steps.init.outcome}\`
#### Terraform Validation 🤖\`${steps.validate.outcome}\`
<details><summary>Validation Output</summary>

\`\`\`
${steps.validate.outputs.stdout}
\`\`\`

</details>

#### Terraform Plan 📖\`${steps.plan.outcome}\`

<details><summary>Show Plan</summary>

\`\`\`
${process.env.PLAN}
\`\`\`

</details>

*Pusher: @${github.actor}, Action: \`${github.event_name}\`, Working Directory: \`${env.tf_actions_working_dir}\`, Workflow: \`${github.workflow}\`*
`.trim();

  // 3. If we have a comment, update it, otherwise create a new one
  if (botComment) {
    github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: botComment.id,
      body: output
    })
  } else {
    github.rest.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: output
    })
  }
}


