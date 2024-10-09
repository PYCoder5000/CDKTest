import * as cdk from 'aws-cdk-lib'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DBStack extends cdk.Stack{
    constructor(scope: Construct, id: string, props: cdk.StackProps){
        super(scope, id, props)
        const table = new Table(this, 'Accounts', {
            partitionKey: { name: 'email', type: AttributeType.STRING },
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
    }
}
