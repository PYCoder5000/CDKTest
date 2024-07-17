import { Stack, StackProps, Tags, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, SubnetType, InstanceType, MachineImage, SecurityGroup, UserData, Peer, Port } from 'aws-cdk-lib/aws-ec2';
import { AutoScalingGroup, HealthCheck, UpdatePolicy } from 'aws-cdk-lib/aws-autoscaling';
import { Ec2RoleStack } from './ec2_role';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';


export interface ASGProds extends StackProps {
    readonly vpc: Vpc;
}

export class ASGStack extends Stack {
    public readonly autoScalingGroup: AutoScalingGroup;
    public readonly alb: ApplicationLoadBalancer;

    constructor(scope: Construct, id: string, props: ASGProds) {
        super(scope, id, props);

        const role_stack = new Ec2RoleStack(this, "EC2_Instance_Role", { env: props.env });
        const userData = UserData.forLinux();
        userData.addCommands(
            'sudo yum update -y',
        )

        const albAsgSecurityGroup = new SecurityGroup(this, 'ASGSecurityGroup', {
            vpc: props.vpc,
            description: 'Allow ssh and HTTP access to ec2 instances',
            allowAllOutbound: true,
        });
        albAsgSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'Allow SSH access from the Internet');
        albAsgSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow HTTP access from the Internet');

        // Create an AutoScaling Group
        this.autoScalingGroup = new AutoScalingGroup(this, 'AutoScalingGroup', {
            vpc: props.vpc,
            instanceType: new InstanceType('t2.micro'),
            machineImage: MachineImage.latestAmazonLinux2023(),
            role: role_stack.role,
            securityGroup: albAsgSecurityGroup,
            minCapacity: 1,
            maxCapacity: 3,
            desiredCapacity: 1,
            vpcSubnets: {
                subnetType: SubnetType.PUBLIC,
            },
            healthCheck: HealthCheck.ec2(),
            updatePolicy: UpdatePolicy.rollingUpdate(),
            userData: userData
        });

        Tags.of(this.autoScalingGroup).add('App', 'website');

        this.alb = new ApplicationLoadBalancer(this, 'ALB', {
            vpc: props.vpc,
            internetFacing: true,
            securityGroup: albAsgSecurityGroup,
        });

        const cert_arn = 'arn:aws:acm:us-east-1:637423383764:certificate/238bd0d6-f0b6-4df9-ac05-205a197dfe49';
        const cert = Certificate.fromCertificateArn(this, 'Certificate', cert_arn);

        const listener = this.alb.addListener('Listener', {
            port: 443, 
            open: true,
            certificates: [cert],
        });

        listener.addTargets('Target', {
            port: 80,
            targets: [this.autoScalingGroup],
            healthCheck: {
                path: '/',
                timeout: Duration.seconds(4),
                interval: Duration.seconds(5),
                unhealthyThresholdCount: 2,
                healthyThresholdCount: 2,
            },
        });

        // Add scaling policies
        this.autoScalingGroup.scaleOnCpuUtilization('KeepSpareCPU', {
            targetUtilizationPercent: 50
        });

        //This should be create after Load balancer
        this.autoScalingGroup.scaleOnRequestCount('ScaleOnRequestCount', {
            targetRequestsPerMinute: 10,
        });

    }
}