import os
import json
import boto3
import uuid
import time

def handler(event, context):
    body = json.loads(event.get('body', '{}'))
    message = body.get('message', '')
    connection_id = event['requestContext']['connectionId']
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']

    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['TABLE_NAME'])
    history_table = dynamodb.Table(os.environ['HISTORY_TABLE_NAME'])

    try:
        response = table.scan(ProjectionExpression='ConnectionId')
        items = response.get('Items', [])

        apigw_management_api = boto3.client('apigatewaymanagementapi', endpoint_url=f"https://{domain_name}/{stage}")
        history_table.put_item(Item={'MessageID': str(uuid.uuid4(message)), 
                                    'Timestamp': int(time.time()),
                                    'Message': message,
                                    'Sender': connection_id,
                               }
        )
        for item in items:
            client_id = item['ConnectionId']
            try:
                apigw_management_api.post_to_connection(Data=message, ConnectionId=client_id)
            except apigw_management_api.exceptions.GoneException:
                table.delete_item(Key={'ConnectionId': client_id})
        return {'statusCode': 200, 'body': 'Data sent.'}
    except Exception as e:
        return {'statusCode': 500, 'body': 'Failed to send message: {}'.format(e)}