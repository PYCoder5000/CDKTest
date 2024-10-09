import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ChatAppStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const table = new dynamodb.Table(this, 'ConnectionsTable', {
            partitionKey: { name: 'ConnectionId', type: dynamodb.AttributeType.STRING },
        });

        const connectHandler = new lambda.Function(this, 'ConnectHandler', {
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'connect.handler',
            environment: {
                TABLE_NAME: table.tableName,
            },
        });

        const disconnectHandler = new lambda.Function(this, 'DisconnectHandler', {
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'disconnect.handler',
            environment: {
                TABLE_NAME: table.tableName,
            },
        });

        const messageHandler = new lambda.Function(this, 'MessageHandler', {
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'message.handler',
            environment: {
                TABLE_NAME: table.tableName,
            },
        });

        table.grantReadWriteData(connectHandler);
        table.grantReadWriteData(disconnectHandler);
        table.grantReadWriteData(messageHandler);
        const policy = new iam.PolicyStatement({
            actions: ['execute-api:ManageConnections'],
            resources: ['*'],
        });
        messageHandler.addToRolePolicy(policy);

        const webSocketApi = new apigateway.WebSocketApi(this, 'ChatApi', {
            connectRouteOptions: {
                integration: new integrations.WebSocketLambdaIntegration('ConnectIntegration', connectHandler),
            },
            disconnectRouteOptions: {
                integration: new integrations.WebSocketLambdaIntegration('DisconnectIntegration', disconnectHandler),
            },
            defaultRouteOptions: {
                integration: new integrations.WebSocketLambdaIntegration('MessageIntegration', messageHandler),
            },
        });

        const stage = new apigateway.WebSocketStage(this, 'DevStage', {
            webSocketApi,
            stageName: 'dev',
            autoDeploy: true,
        });

        new cdk.CfnOutput(this, 'WebSocketUrl', {
            value: stage.url,
        });
    }
}