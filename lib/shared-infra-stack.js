const { Stack, CfnOutput, RemovalPolicy, aws_ecs, aws_iam } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const rds = require('aws-cdk-lib/aws-rds');
const autoscaling = require('aws-cdk-lib/aws-autoscaling')
const cdk = require('aws-cdk-lib');



class SharedInfraStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
      vpcId: 'vpc-084bacc70db0dcefd',
    });

    const cluster = new aws_ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: 'notification-ecs-cluster',
      containerInsights: true,
    });

      const ec2InstanceRole = new aws_iam.Role(this, 'ec2InstanceRole', {
          assumedBy: new aws_iam.ServicePrincipal('ec2.amazonaws.com'),
      });

      ec2InstanceRole.addManagedPolicy(
          aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
              'service-role/AmazonEC2ContainerServiceforEC2Role',
          ),
      );

      ec2InstanceRole.addManagedPolicy(
          aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
              'AmazonSSMManagedInstanceCore',
          ),
      );

      ec2InstanceRole.addManagedPolicy(
          aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
              'AmazonEC2ContainerRegistryReadOnly',
          ),
      );

      const bastionSecurityGroup = new ec2.SecurityGroup(
          this,
          'BastionSecurityGroup',
          {
              vpc,
              description: 'Security group for notification bastion host',
              allowAllOutbound: true,
          }
      );


      const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EcsHostSg', {
          vpc,
          allowAllOutbound: true,
      });

      ec2SecurityGroup.addIngressRule(
          bastionSecurityGroup,
          ec2.Port.tcp(22),
          'Allow SSH from bastion',
      );

      const asg = new autoscaling.AutoScalingGroup(this, `ec2-asg`, {
          vpc,
          instanceType: new ec2.InstanceType('t3.nano'),
          machineImage: aws_ecs.EcsOptimizedImage.amazonLinux2023(),
          role: ec2InstanceRole,
          securityGroup: ec2SecurityGroup,
          vpcSubnets: {
              subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          minCapacity: 1,
          maxCapacity: 1,
          desiredCapacity: 1,
      });


      const cp = new aws_ecs.AsgCapacityProvider(this, 'EcsNotificationCapacityProvider', {
          autoScalingGroup: asg,
      });

      cluster.addAsgCapacityProvider(cp);

      new cdk.CfnOutput(this, 'EcsNotificationCapacityProviderName', {
          value: cp.capacityProviderName,
          exportName: 'EcsNotificationCapacityProvider'
      });



    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Security group for notification RDS',
      allowAllOutbound: false,
    });

    // const bastionSecurityGroup = new ec2.SecurityGroup(
    //   this,
    //   'BastionSecurityGroup',
    //   {
    //     vpc,
    //     description: 'Security group for notification bastion host',
    //     allowAllOutbound: true,
    //   }
    // );


    bastionSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH from anywhere'
    );

    bastionSecurityGroup.connections.allowTo(
      dbSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL to database'
    );

    dbSecurityGroup.connections.allowTo(
      bastionSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow outbound to bastion'
    );


    const bastion = new ec2.Instance(this, 'Bastion_Host', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: bastionSecurityGroup,
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
      keyName: 'bastion host ssh key pair',
    });


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

    new CfnOutput(this, 'ClusterArn', {
      value: cluster.clusterArn,
      exportName: 'SharedNotificationClusterArn',
    });

    new CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      exportName: 'SharedNotificationClusterName',
    });


      new cdk.CfnOutput(this, 'BastionSecurityGroupId', {
          value: bastion.connections.securityGroups[0].securityGroupId,
          exportName: 'BastionSecurityGroupId',
      });
  }
}

module.exports = { SharedInfraStack };
