const { Stack, CfnOutput, RemovalPolicy, aws_ecs, aws_iam, aws_ssm: ssm, aws_route53, aws_certificatemanager, aws_elasticloadbalancingv2, aws_route53_targets } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const rds = require('aws-cdk-lib/aws-rds');
const cognito = require('aws-cdk-lib/aws-cognito');
const apigwv2 = require('aws-cdk-lib/aws-apigatewayv2');
const apigwv2Authorizers = require('aws-cdk-lib/aws-apigatewayv2-authorizers');
const apigwv2Integrations = require('aws-cdk-lib/aws-apigatewayv2-integrations');
const lambda = require('aws-cdk-lib/aws-lambda');
const autoscaling = require('aws-cdk-lib/aws-autoscaling');
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
          keyName: 'bastion host ssh key pair',
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

    const rdsSG = database.connections.securityGroups[0]

      rdsSG.addIngressRule(
          ec2SecurityGroup,
          ec2.Port.tcp(5432),
          'Allow EC2 instances with ecs tasks access to connect to rds'
      );

      new ssm.StringParameter(this, 'RdsSgId', {
          parameterName: '/notifications/rds-sg-id',
          stringValue: rdsSG.securityGroupId,
      });

    const userPool = new cognito.UserPool(this, 'NotificationUserPool', {
      userPoolName: 'notification-user-pool',
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      standardAttributes: {
        email: { required: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const userPoolClient = userPool.addClient('NotificationAppClient', {
      userPoolClientName: 'notification-app-client',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
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


      const hostedZone = aws_route53.HostedZone.fromLookup(this, "HostedZone", {
          domainName: "benjaminreinecke.click",
      });


      const certificate = new aws_certificatemanager.Certificate(this, "Certificate", {
          domainName: "api.notifications.benjaminreinecke.click",
          validation: aws_certificatemanager.CertificateValidation.fromDns(hostedZone),
      });





      const albSecurityGroup = new ec2.SecurityGroup(this, "AlbSecurityGroup", {
          vpc,
          allowAllOutbound: true,
          description: "Security group for the public Application Load Balancer",
      });

      albSecurityGroup.addIngressRule(
          ec2.Peer.anyIpv4(),
          ec2.Port.tcp(80),
          "Allow HTTP"
      );

      albSecurityGroup.addIngressRule(
          ec2.Peer.anyIpv4(),
          ec2.Port.tcp(443),
          "Allow HTTPS"
      );


      const alb = new aws_elasticloadbalancingv2.ApplicationLoadBalancer(this, "Alb", {
          vpc,
          internetFacing: true,
          securityGroup: albSecurityGroup,
      });

      const listener = alb.addListener("HttpsListener", {
          port: 443,
          certificates: [certificate],
          defaultAction: aws_elasticloadbalancingv2.ListenerAction.fixedResponse(404),
      });

      new aws_route53.ARecord(this, "ApiAlias", {
          zone: hostedZone,
          recordName: "api.notifications",
          target: aws_route53.RecordTarget.fromAlias(
              new aws_route53_targets.LoadBalancerTarget(alb)
          ),
      });


      new ssm.StringParameter(this, "ALBListenerArn", {
          parameterName: "/notifications/alb/listener/https/arn",
          stringValue: listener.listenerArn,
      });

      new ssm.StringParameter(this, "ALBArn", {
          parameterName: "/notifications/alb/arn",
          stringValue: alb.loadBalancerArn,
      });

      new ssm.StringParameter(this, "ALBSecurityGroupId", {
          parameterName: "/notifications/alb/security-group-id",
          stringValue: albSecurityGroup.securityGroupId,
      });

      const api2Certificate = new aws_certificatemanager.Certificate(this, "Api2Certificate", {
          domainName: "api2.notifications.benjaminreinecke.click",
          validation: aws_certificatemanager.CertificateValidation.fromDns(hostedZone),
      });

      const api2JwtAuthorizer = new apigwv2Authorizers.HttpJwtAuthorizer(
          "Api2JwtAuthorizer",
          `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
          {
              jwtAudience: [userPoolClient.userPoolClientId],
          },
      );

      const api2Gateway = new apigwv2.HttpApi(this, "Api2Gateway", {
          apiName: "notification-api2",
          description: "Shared API Gateway for notification services (api2)",
          defaultAuthorizer: api2JwtAuthorizer,
          corsPreflight: {
              allowOrigins: ['*'],
              allowHeaders: [
                  'Content-Type',
                  'Authorization',
                  'Referer-Policy',
                  'Origin',
                  'Accept',
              ],
              exposeHeaders: ['Location'],
              allowMethods: ['*'],
          },
      });

      const api2HealthHandler = new lambda.Function(this, "Api2HealthHandler", {
          runtime: lambda.Runtime.NODEJS_20_X,
          handler: "index.handler",
          code: lambda.Code.fromInline(
              "exports.handler = async () => ({ statusCode: 200, body: JSON.stringify({ status: 'healthy' }) });",
          ),
      });

      api2Gateway.addRoutes({
          path: "/health",
          methods: [apigwv2.HttpMethod.GET],
          integration: new apigwv2Integrations.HttpLambdaIntegration(
              "Api2HealthIntegration",
              api2HealthHandler,
          ),
      });

      const api2Domain = new apigwv2.DomainName(this, "Api2Domain", {
          domainName: "api2.notifications.benjaminreinecke.click",
          certificate: api2Certificate,
      });

      new apigwv2.ApiMapping(this, "Api2ApiMapping", {
          api: api2Gateway,
          domainName: api2Domain,
          stage: api2Gateway.defaultStage,
      });

      new aws_route53.ARecord(this, "Api2Alias", {
          zone: hostedZone,
          recordName: "api2.notifications",
          target: aws_route53.RecordTarget.fromAlias(
              new aws_route53_targets.ApiGatewayv2DomainProperties(
                  api2Domain.regionalDomainName,
                  api2Domain.regionalHostedZoneId,
              ),
          ),
      });

      new ssm.StringParameter(this, "Api2GatewayIdParam", {
          parameterName: "/notifications/apigateway/api2/id",
          stringValue: api2Gateway.apiId,
      });

      new ssm.StringParameter(this, "Api2GatewayEndpointParam", {
          parameterName: "/notifications/apigateway/api2/endpoint",
          stringValue: "https://api2.notifications.benjaminreinecke.click",
      });

      new ssm.StringParameter(this, "Api2DefaultAuthorizerIdParam", {
          parameterName: "/notifications/apigateway/api2/default-authorizer-id",
          stringValue: api2JwtAuthorizer.authorizerId,
      });

      new ssm.StringParameter(this, "Api2DefaultAuthorizerTypeParam", {
          parameterName: "/notifications/apigateway/api2/default-authorizer-type",
          stringValue: api2JwtAuthorizer.authorizationType,
      });

      new CfnOutput(this, "Api2GatewayIdOutput", {
          value: api2Gateway.apiId,
          exportName: "SharedNotificationApi2GatewayId",
      });

      new CfnOutput(this, "Api2GatewayEndpointOutput", {
          value: "https://api2.notifications.benjaminreinecke.click",
          exportName: "SharedNotificationApi2GatewayEndpoint",
      });



  }
}

module.exports = { SharedInfraStack };
