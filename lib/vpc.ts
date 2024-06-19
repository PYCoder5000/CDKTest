import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, SubnetType, SecurityGroup, Peer, Port } from 'aws-cdk-lib/aws-ec2';

export class VpcStack extends Stack {
    public readonly vpc: Vpc;
    public readonly ec2SG: SecurityGroup;
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        this.vpc = new Vpc(this, 'MyVPC', {
            maxAzs: 3,
            subnetConfiguration: [
              {
                cidrMask: 24,
                name: 'PublicSubnet',
                subnetType: SubnetType.PUBLIC,
              },
            ],
        });
        this.ec2SG = new SecurityGroup(this, 'EC2SecurityGroup', {
            vpc: this.vpc,
            description: 'Allow ssh and HTTP access to ec2 instances',
            allowAllOutbound: true,
        });
        this.ec2SG.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'Allow SSH access from the Internet');
        this.ec2SG.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow HTTP access from the Internet');
    }
}