import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Instance } from 'aws-cdk-lib/aws-ec2';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

export interface Ec2Prods extends StackProps {
    readonly ec2Instance: Instance;
}

export class Route53Stack extends Stack {
    constructor(scope: Construct, id: string, props: Ec2Prods) {
        super(scope, id, props);

        const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: 'ailec.me',
        });

        new route53.ARecord(this, 'MyARecord', {
            zone: hostedZone,
            recordName: 'www',
            target: route53.RecordTarget.fromIpAddresses(props.ec2Instance.instancePublicIp),
        });
    }
}