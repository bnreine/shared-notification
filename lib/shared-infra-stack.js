const { Stack, CfnOutput, RemovalPolicy, aws_ecs } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const rds = require('aws-cdk-lib/aws-rds');

class SharedInfraStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
      vpcId: 'vpc-084bacc70db0dcefd',
    });

    // const cluster = new aws_ecs.Cluster(this, 'Cluster', {
    //   vpc,
    //   clusterName: 'notification-ecs-cluster',
    //   containerInsights: true,
    // });

    // const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
    //   vpc,
    //   description: 'Security group for notification ECS services',
    //   allowAllOutbound: true,
    // });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Security group for notification RDS',
      allowAllOutbound: false,
    });

    // dbSecurityGroup.addIngressRule(
    //   ecsSecurityGroup,
    //   ec2.Port.tcp(5432),
    //   'Allow PostgreSQL from ECS services'
    // );

    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSecurityGroup],
      databaseName: 'notification',
      credentials: rds.Credentials.fromGeneratedSecret('dbadmin'),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      publiclyAccessible: false,
      deletionProtection: true,
      removalPolicy: RemovalPolicy.SNAPSHOT,
    });

    // new CfnOutput(this, 'ClusterArn', {
    //   value: cluster.clusterArn,
    //   exportName: 'SharedNotificationClusterArn',
    // });
    //
    // new CfnOutput(this, 'ClusterName', {
    //   value: cluster.clusterName,
    //   exportName: 'SharedNotificationClusterName',
    // });

    // new CfnOutput(this, 'EcsSecurityGroupId', {
    //   value: ecsSecurityGroup.securityGroupId,
    //   exportName: 'SharedNotificationEcsSecurityGroupId',
    // });

    // new CfnOutput(this, 'DatabaseEndpoint', {
    //   value: database.dbInstanceEndpointAddress,
    //   exportName: 'SharedNotificationDatabaseEndpoint',
    // });

    // new CfnOutput(this, 'DatabasePort', {
    //   value: database.dbInstanceEndpointPort,
    //   exportName: 'SharedNotificationDatabasePort',
    // });

    // new CfnOutput(this, 'DatabaseSecretArn', {
    //   value: database.secret.secretArn,
    //   exportName: 'SharedNotificationDatabaseSecretArn',
    // });
  }
}

module.exports = { SharedInfraStack };
