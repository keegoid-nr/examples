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

# ---------------------------------

# import botocore.session
# import json
# import newrelic.agent

# # Create a botocore session
# session = botocore.session.get_session()

# # Create a low-level DynamoDB client
# dynamodb = session.create_client('dynamodb', region_name='us-west-2')

# # Specify the table
# table_name = 'KMULLANEY_TABLE'

# # Sample text to put into DynamoDB
# item = {
#     'PrimaryKey': {'N': '999'},  # Explicitly specify the number type
#     'Text': {'S': 'Sample text to store in DynamoDB'}  # Explicitly specify the string type
# }

# def handler(event, context):
#     # Put the item into the DynamoDB table
#     try:
#         response = dynamodb.put_item(TableName=table_name, Item=item)
#         print("PutItem succeeded:", json.dumps(response, indent=4))
#     except Exception as e:
#         print("Error putting item into DynamoDB:", e)

#     # Check and print the specified attributes
#     if hasattr(dynamodb, "_client_config"):
#         region = getattr(dynamodb._client_config, "region_name", None)
#         print(f"Region: {region}")

#     if hasattr(dynamodb, "_endpoint"):
#         host = getattr(dynamodb._endpoint, "host", None)
#         print(f"Host: {host}")

#     if hasattr(newrelic, "agent"):
#         settings = newrelic.agent.global_settings()
#         if settings and hasattr(settings.cloud, "aws"):
#             account_id = getattr(settings.cloud.aws, "account_id", None)
#             print(f"Account ID: {account_id}")
