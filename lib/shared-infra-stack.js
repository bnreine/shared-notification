const { Stack, CfnOutput, aws_ecs, Fn } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');

class SharedInfraStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcId: 'vpc-0058a26222d743b85' });

    const cluster = new aws_ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: 'notification-ecs-cluster',
      containerInsights: true,
    });

    new CfnOutput(this, 'ClusterArn', {
      value: cluster.clusterArn,
      exportName: 'SharedNotificationClusterArn',
    });

    new CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      exportName: 'SharedNotificationClusterName',
    });
  }
}

module.exports = { SharedInfraStack };
