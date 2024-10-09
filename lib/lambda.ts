import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { InitGroup } from 'aws-cdk-lib/aws-ec2';

export class LambdaStack extends cdk.Stack{
    constructor(scope: Construct, id: string, props: cdk.StackProps){
        super(scope, id, props)
        const table = new Table(this, 'Weather', {
            partitionKey: { name: 'location', type: AttributeType.STRING },
            sortKey: {name: 'timestamp', type: AttributeType.STRING},
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const lambdaFunction = new lambda.Function(this, 'MyPythonLambda', {
            runtime: lambda.Runtime.PYTHON_3_12,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('dummy'),
        });
        table.grantWriteData(lambdaFunction);
        const artifactBucket = new s3.Bucket(this, 'WeatherBucket');
        const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
            pipelineName: 'PythonLambdaPipeline',
            artifactBucket: artifactBucket,
        });
        const sourceOutput = new codepipeline.Artifact();
        const sourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub_Source',
            owner: 'PYCoder5000',
            repo: 'WeatherLambda',
            oauthToken: cdk.SecretValue.secretsManager('WeatherLambdaToken1', {
                jsonField: 'WeatherLambdaToken1'
            }),
            output: sourceOutput,
            branch: 'main',
        });
        pipeline.addStage({
            stageName: 'Source',
            actions: [sourceAction],
        });
        const buildOutput = new codepipeline.Artifact();
        const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    install: {
                        commands: ['pip install -r requirements.txt -t .'],
                    },
                    build: {
                        commands: ['zip -r lambda.zip .'],
                    },
                },
                artifacts: {
                    'base-directory': '.',
                    files: ['lambda.zip'],
                },
            }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
            },
        });
        const buildAction = new codepipeline_actions.CodeBuildAction({
            actionName: 'Build',
            project: buildProject,
            input: sourceOutput,
            outputs: [buildOutput],
        });
        pipeline.addStage({
            stageName: 'Build',
            actions: [buildAction],
        });
        const deployProject = new codebuild.PipelineProject(this, 'DeployProject', {
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    build: {
                        commands: [
                            'echo Deploying to Lambda',
                            'aws lambda update-function-code --function-name ' + lambdaFunction.functionName + ' --zip-file fileb://lambda.zip',
                        ],
                    },
                },
            }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
            },
        });
        deployProject.role!.addToPrincipalPolicy(new iam.PolicyStatement({
            actions: ['lambda:UpdateFunctionCode'],
            resources: [lambdaFunction.functionArn],
        }));
        const deployAction = new codepipeline_actions.CodeBuildAction({
            actionName: 'Lambda_Deploy',
            project: deployProject,
            input: buildOutput,
        });
        pipeline.addStage({
            stageName: 'Deploy',
            actions: [deployAction],
        });
    }
}
