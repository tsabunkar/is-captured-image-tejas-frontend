output "cloudfront_url" {
  value = aws_cloudfront_distribution.react_cdn.domain_name
}