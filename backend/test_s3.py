import sys
sys.path.insert(0, '.')
import boto3

client = boto3.client('s3', region_name='us-east-1')

key = 'cob_eob_images/899929183.png'
try:
    resp = client.head_object(Bucket='dice-bpaas-bucket', Key=key)
    print(f"File EXISTS at {key}")
    print(f"Content-Type: {resp['ContentType']}")
    print(f"Size: {resp['ContentLength']} bytes")
except Exception as e:
    print(f"File NOT FOUND at {key}: {e}")

# Generate URL with correct key
url = client.generate_presigned_url('get_object', Params={'Bucket': 'dice-bpaas-bucket', 'Key': key}, ExpiresIn=3600)
print(f"\nPre-signed URL:\n{url}")
