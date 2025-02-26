import boto3
import json
import newrelic.agent

# Initialize DynamoDB client and table outside the handler
session = boto3.Session()
dynamodb = session.resource('dynamodb')
table_name = 'KMULLANEY_TABLE'
table = dynamodb.Table(table_name)

def handler(event, context):
    # Generate sample items to put into the DynamoDB table
    items = [{'UserID': i, 'Text': f'Sample text {i}'} for i in range(1, 101)]

    for item in items:
        try:
            table.put_item(Item=item)
            print(f"Inserted UserID {item['UserID']}")
        except Exception as e:
            print(f"Error inserting item: {str(e)}")
            print("Table key schema:", table.key_schema)

    # Check and print the specified attributes
    client = session.client('dynamodb')

    if hasattr(client, "_client_config"):
        region = getattr(client._client_config, "region_name", None)
        print(f"Region: {region}")

    if hasattr(client, "_endpoint"):
        host = getattr(client._endpoint, "host", None)
        print(f"Host: {host}")

    if hasattr(newrelic, "agent"):
        settings = newrelic.agent.global_settings()
        if settings:
            if hasattr(settings, "cloud"):
                if hasattr(settings.cloud, "aws"):
                    account_id = getattr(settings.cloud.aws, "account_id", None)
                    print(f"Account ID: {account_id}")
                else:
                    print("No 'aws' attribute found in settings.cloud")
            else:
                print("No 'cloud' attribute found in settings")

    return {
        'statusCode': 200,
        'body': json.dumps('Operation completed')
    }
