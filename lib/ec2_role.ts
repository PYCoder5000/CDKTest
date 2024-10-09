
import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Role } from 'aws-cdk-lib/aws-iam';
import { ServicePrincipal, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

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
        this.role.addToPolicy(new PolicyStatement({
            actions: [
                'codedeploy:CreateDeployment',
                'codedeploy:GetDeployment',
                'codedeploy:RegisterApplicationRevision',
                'codedeploy:GetApplication',
                'codedeploy:GetApplicationRevision',
                'dynamodb:BatchGetItem',
                'dynamodb:BatchWriteItem',
                'dynamodb:DeleteItem',
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:UpdateItem',
                'ses:SendEmail',
                'ses:SendRawEmail',
            ],
            resources: ['*'],
        }));
        
    }
}