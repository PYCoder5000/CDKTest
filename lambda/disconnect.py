import os
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    connection_id = event['requestContext']['connectionId']

    try:
        table.delete_item(Key={'ConnectionId': connection_id})
        return {'statusCode': 200, 'body': 'Disconnected.'}
    except Exception as e:
        return {'statusCode': 500, 'body': 'Failed to disconnect: {}'.format(e)}