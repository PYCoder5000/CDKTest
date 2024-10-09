import json
import boto3
import requests

def lambda_handler(event, context):
    location = 'Milpitas'
    data = requests.get(f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid=bd26e2b50786f956d7ed54d34a952399&units=metric")
    dataJson = data.json()
    db = boto3.resource('dynamodb', region_name='us-east-1')
    weatherTable = db.Table("WebStacklambdaStack294303EF-Weather812728CF-U3726M1L0A53")
    weatherTable.put_item(
        Item={
            "location": location,
            "timestamp": dataJson['dt'],
            "temp": str(dataJson['main']['temp']),
            "weather": dataJson['weather'][0]['main']
        }
    )
    
