const { Stack, pipelines, Fn, aws_codebuild } = require('aws-cdk-lib');

const { CodePipeline, CodePipelineSource, ShellStep } = pipelines;
const { ProductionStage } = require('./production-stage');

class CodepipelineStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const githubConnectionArn = Fn.importValue('GlobalGitHubConnectionArn');

    const source = CodePipelineSource.connection(
        'bnreine/shared-notification',
        'main',
        {
            connectionArn: githubConnectionArn,
            triggerOnPush: true,
        }
    )

    const pipeline = new CodePipeline(this, 'SharedNotificationPipeline', {
      codeBuildDefaults: {
        buildEnvironment: {
          buildImage: aws_codebuild.LinuxBuildImage.STANDARD_7_0,
        },
        partialBuildSpec: aws_codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: 20,
              },
            },
          },
        }),
      },
      pipelineName: 'SharedNotificationPipeline',
      selfMutation: true,
      synth: new ShellStep('Synth', {
        input: source,
        commands: ['npm ci', 'npx cdk synth'],
      }),
    });

      const productionStage = pipeline.addStage(new ProductionStage(this, 'ProductionStage', props));


      productionStage.addPost(
          new pipelines.ManualApprovalStep("ApproveProductionMigration", {
              comment: "Review and approve the production migration",
          }),

          new pipelines.ShellStep("RunProductionMigration", {
              commands: [
                  `aws codebuild start-build --project-name prod-db-migration`,
              ],
          })

      );


    pipeline.buildPipeline();
  }
}

module.exports = { CodepipelineStack };
