const {
  Stack,
  Duration,
pipelines,
  Fn,
} = require("aws-cdk-lib");

const { CodePipeline, CodePipelineSource, ShellStep } = pipelines;

// const sqs = require('aws-cdk-lib/aws-sqs');

class CodepipelineStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const githubConnectionArn = Fn.importValue("GlobalGitHubConnectionArn");

    const pipeline = new CodePipeline(this, "SharedNotificationPipeline", {
      pipelineName: "SharedNotificationPipeline",
        selfMutation: true,
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.connection(
          "bnreine/shared-notification",
          "main",
          {
            connectionArn: githubConnectionArn,
            triggerOnPush: true,
          },
        ),
        commands: ["npm ci", "npm run synth"],
      }),
    });
    pipeline.buildPipeline();
  }
}

module.exports = { CodepipelineStack };
