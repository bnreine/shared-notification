const { Stack, pipelines, Fn, aws_codebuild, aws_iam, aws_ssm: ssm } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');

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

      const vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
          vpcId: 'vpc-084bacc70db0dcefd',
      });

      const migrationSg = new ec2.SecurityGroup(this, 'MigrationSg', { vpc });

      // The RDS security group lives in the production stage and allows this SG in
      new ssm.StringParameter(this, 'MigrationSgId', {
          parameterName: '/notifications/migration-sg-id',
          stringValue: migrationSg.securityGroupId,
      });

      const migrationStep = new pipelines.CodeBuildStep(
          "RunProductionMigration",
          {
              input: source,
              env: {
                  DB_SECRET_NAME: 'migration_user_rds',
              },
              buildEnvironment: {
                  buildImage: aws_codebuild.LinuxBuildImage.STANDARD_7_0,
              },
              vpc,
              subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
              securityGroups: [migrationSg],
              rolePolicyStatements: [
                  new aws_iam.PolicyStatement({
                      actions: ['secretsmanager:GetSecretValue'],
                      resources: [
                          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:migration_user_rds-*`,
                      ],
                  }),
              ],
              commands: [
                  'npm ci',
                  'SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$DB_SECRET_NAME" --query SecretString --output text)',
                  `DB_USER=$(echo "$SECRET_JSON" | jq -r '.username')`,
                  `DB_PASSWORD=$(echo "$SECRET_JSON" | jq -r '.password')`,
                  `DB_HOST=$(echo "$SECRET_JSON" | jq -r '.host')`,
                  `DB_PORT=$(echo "$SECRET_JSON" | jq -r '.port')`,
                  `DB_NAME=$(echo "$SECRET_JSON" | jq -r '.dbname')`,
                  'ENCODED_USER=$(node -p "encodeURIComponent(process.argv[1])" "$DB_USER")',
                  'ENCODED_PASSWORD=$(node -p "encodeURIComponent(process.argv[1])" "$DB_PASSWORD")',
                  'export DATABASE_URL="postgresql://${ENCODED_USER}:${ENCODED_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"',
                  'npx prisma migrate deploy',
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
