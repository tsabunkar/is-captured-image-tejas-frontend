resource "aws_s3_bucket" "react_site" {
  bucket = "tejas-react-frontend-prod"

  tags = {
    Name = "ReactFrontend"
  }
}

resource "aws_s3_bucket_public_access_block" "react_site" {
  bucket = aws_s3_bucket.react_site.id

  block_public_acls   = true
  block_public_policy = true
  ignore_public_acls  = true
  restrict_public_buckets = true
}

// Terraform to upload static files
resource "aws_s3_object" "react_files" {
  for_each = fileset("../build", "**/*")

  bucket = aws_s3_bucket.react_site.id
  key    = each.value
  source = "../build/${each.value}"
  etag   = filemd5("../build/${each.value}")

  content_type = lookup(
    {
      html = "text/html"
      css  = "text/css"
      js   = "application/javascript"
      json = "application/json"
      png  = "image/png"
      jpg  = "image/jpeg"
      jpeg = "image/jpeg"
      svg  = "image/svg+xml"
      ico  = "image/x-icon"
      map  = "application/json"
      txt  = "text/plain"
    },
    split(".", each.value)[length(split(".", each.value)) - 1],
    "binary/octet-stream"
  )
}



# resource "aws_s3_bucket_policy" "react_policy" {
#   bucket = aws_s3_bucket.react_site.id

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Principal = "*"
#         Action = "s3:GetObject"
#         Resource = "${aws_s3_bucket.react_site.arn}/*"
#       }
#     ]
#   })
# }

resource "aws_s3_bucket_policy" "react_policy" {
  bucket = aws_s3_bucket.react_site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.react_site.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.react_cdn.arn
          }
        }
      }
    ]
  })
}