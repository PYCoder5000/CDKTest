import os
import boto3
from boto3.dynamodb.conditions import Key
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])
history_table = dynamodb.Table(os.environ['HISTORY_TABLE_NAME'])

def handler(event, context):
    connection_id = event['requestContext']['connectionId']
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    apigw_management_api = boto3.client('apigatewaymanagementapi', endpoint_url=f"https://{domain_name}/{stage}")
    try:
        table.put_item(Item={'ConnectionId': connection_id})
    except Exception as e:
        return {'statusCode': 500, 'body': 'Failed to connect: {}'.format(e)}
    try:
        response = history_table.query(
            IndexName='TimestampIndex',
            KeyConditionExpression=Key('SecondaryPartitionKey').eq('Message'),
            ScanIndexForward=True,
            Limit=20,
            ProjectionExpression='Message, Timestamp, Sender',
        )
        recent_messages = response.get('Items', [])

        apigw_management_api = boto3.client('apigatewaymanagementapi', endpoint_url=f"https://{domain_name}/{stage}")

        for msg in sorted(recent_messages, key=lambda x: x['Timestamp']):
            data = json.dumps({
                'message': msg['Message'],
                'sender': msg['Sender'],
                'timestamp': msg['Timestamp'],
            })
            apigw_management_api.post_to_connection(Data=data, ConnectionId=connection_id)
    except:
        return {'statusCode': 500, 'body': 'Failed to get previous messages: {}'.format(e)}
    return {'statusCode': 200, 'body': 'Connected.'}