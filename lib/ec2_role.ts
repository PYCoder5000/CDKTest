
import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Role } from 'aws-cdk-lib/aws-iam';
import { ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';

export class Ec2RoleStack extends Stack {
    readonly role: Role;
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);
        this.role = new Role(this, 'MyInstanceRole', {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
            description: 'EC2 role',
        });
        this.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'));
        this.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSCodeDeployFullAccess'));
    }
}