from storages.backends.s3boto import S3BotoStorage

class AmazonS3(S3BotoStorage):
	base_url = 'portfolio-sandromiccoli.s3.amazonaws.com'