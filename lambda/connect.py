import os
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    connection_id = event['requestContext']['connectionId']

    try:
        table.put_item(Item={'ConnectionId': connection_id})
        return {'statusCode': 200, 'body': 'Connected.'}
    except Exception as e:
        return {'statusCode': 500, 'body': 'Failed to connect: {}'.format(e)}