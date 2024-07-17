import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Instance } from 'aws-cdk-lib/aws-ec2';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export interface Ec2Prods extends StackProps {
    readonly alb: ApplicationLoadBalancer;
}

export class Route53Stack extends Stack {
    constructor(scope: Construct, id: string, props: Ec2Prods) {
        super(scope, id, props);

        const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: 'chrisjin.org',
        });

        new route53.ARecord(this, 'MyARecord', {
            zone: hostedZone,
            recordName: 'www',
            target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(props.alb)),
        });
    }
}