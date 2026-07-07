import uuid
from datetime import timedelta

import boto3
from botocore.client import Config

from app.core.config import settings


def _client():
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
        region_name=settings.S3_REGION,
        use_ssl=settings.S3_USE_SSL,
        config=Config(signature_version="s3v4"),
    )


def build_storage_key(prefix: str, filename: str) -> str:
    return f"{prefix}/{uuid.uuid4()}/{filename}"


def upload_bytes(storage_key: str, data: bytes, content_type: str) -> None:
    _client().put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=storage_key,
        Body=data,
        ContentType=content_type,
        ServerSideEncryption="AES256",
    )


def download_bytes(storage_key: str) -> bytes:
    response = _client().get_object(Bucket=settings.S3_BUCKET_NAME, Key=storage_key)
    return response["Body"].read()


def delete_object(storage_key: str) -> None:
    _client().delete_object(Bucket=settings.S3_BUCKET_NAME, Key=storage_key)


def presigned_download_url(storage_key: str, expires_in: timedelta = timedelta(minutes=15)) -> str:
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": storage_key},
        ExpiresIn=int(expires_in.total_seconds()),
    )
