const { Stack, pipelines, Fn, aws_codebuild } = require('aws-cdk-lib');

const { CodePipeline, CodePipelineSource, ShellStep } = pipelines;
const { ProductionStage } = require('./production-stage');

class CodepipelineStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const githubConnectionArn = Fn.importValue('GlobalGitHubConnectionArn');

    const pipeline = new CodePipeline(this, 'SharedNotificationPipeline', {
      pipelineName: 'SharedNotificationPipeline',
      selfMutation: true,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.connection(
          'bnreine/shared-notification',
          'main',
          {
            connectionArn: githubConnectionArn,
            triggerOnPush: true,
          }
        ),
        commands: ['npm ci', 'npx cdk synth'],
        codeBuildDefaults: {
          buildEnvironment: {
            buildImage: aws_codebuild.LinuxBuildImage.STANDARD_7_0,
          },
        },
      }),
    });

    pipeline.addStage(new ProductionStage(this, 'ProductionStage', props));

    pipeline.buildPipeline();
  }
}

module.exports = { CodepipelineStack };
