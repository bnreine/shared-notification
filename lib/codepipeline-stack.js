const { Stack, pipelines, Fn, aws_codebuild, aws_iam } = require('aws-cdk-lib');

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


      const approvalStep = new pipelines.ManualApprovalStep(
          "ApproveProductionMigration",
          {
              comment: "Review and approve the production migration",
          },
      );

      const migrationStep = new pipelines.CodeBuildStep(
          "RunProductionMigration",
          {
              commands: [
                  `aws codebuild start-build --project-name notifications-prod-migration`,
              ],
              rolePolicyStatements: [
                  new aws_iam.PolicyStatement({
                      actions: ['codebuild:StartBuild'],
                      resources: [
                          'arn:aws:codebuild:us-east-1:010273536955:project/prod-db-migration',
                      ],
                  }),
              ],
          },
      );

      migrationStep.addStepDependency(approvalStep);

      productionStage.addPost(
          approvalStep,
          migrationStep,
      );


    pipeline.buildPipeline();
  }
}

module.exports = { CodepipelineStack };
