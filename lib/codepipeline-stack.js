const { Stack, pipelines, Fn } = require('aws-cdk-lib');

const { CodePipeline, CodePipelineSource, ShellStep } = pipelines;

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
        commands: ['npm install', 'npm run synth'],
      }),
    });
    pipeline.buildPipeline();
  }
}

module.exports = { CodepipelineStack };
