import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnEmailIdentity } from 'aws-cdk-lib/aws-ses';

export class SesStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        const verifiedEmail = new CfnEmailIdentity(this, 'VerifiedEmailIdentity', {
            emailIdentity: 'chrisbobacat@gmail.com'
        });
    }
}
