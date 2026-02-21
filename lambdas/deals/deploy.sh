#!/bin/bash
set -e

# ─── CONFIG ───────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────────────────────────

echo "🔍 Validating config..."
MISSING=()
[ -z "$AWS_ACCOUNT_ID" ]     && MISSING+=("AWS_ACCOUNT_ID")
[ -z "$API_GATEWAY_ID" ]     && MISSING+=("API_GATEWAY_ID")
[ -z "$JWT_SECRET" ]         && MISSING+=("JWT_SECRET")
[ -z "$DB_HOST" ]            && MISSING+=("DB_HOST")
[ -z "$DB_NAME" ]            && MISSING+=("DB_NAME")
[ -z "$DB_USER" ]            && MISSING+=("DB_USER")
[ -z "$DB_PASSWORD" ]        && MISSING+=("DB_PASSWORD")
[ -z "$SUBNET_IDS" ]         && MISSING+=("SUBNET_IDS")
[ -z "$SECURITY_GROUP_IDS" ] && MISSING+=("SECURITY_GROUP_IDS")

if [ ${#MISSING[@]} -ne 0 ]; then
  echo "❌ Please fill in these variables at the top of the script:"
  for v in "${MISSING[@]}"; do echo "   - $v"; done
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/dist"
ZIP_PATH="$SCRIPT_DIR/deals-lambda.zip"

# ─── Step 1: Build ────────────────────────────────────────────────────────────
echo ""
echo "📦 Installing dependencies and building..."
cd "$SCRIPT_DIR"
npm install
npm run build

# ─── Step 2: Zip ─────────────────────────────────────────────────────────────
echo ""
echo "🗜️  Creating deployment zip..."
rm -f "$ZIP_PATH"
cp -r node_modules "$BUILD_DIR/node_modules"
cd "$BUILD_DIR"
zip -r "$ZIP_PATH" . -x "*.ts"
cd "$SCRIPT_DIR"
echo "   ✅ Zip created: $ZIP_PATH"

# ─── Step 3: IAM Role ────────────────────────────────────────────────────────
echo ""
echo "🔐 Creating IAM role: $ROLE_NAME..."

TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}'

ROLE_ARN=$(aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document "$TRUST_POLICY" \
  --query "Role.Arn" \
  --output text 2>/dev/null || \
  aws iam get-role --role-name "$ROLE_NAME" --query "Role.Arn" --output text)

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" 2>/dev/null || true

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole" 2>/dev/null || true

echo "   ✅ Role ARN: $ROLE_ARN"
echo "   ⏳ Waiting 10s for IAM role to propagate..."
sleep 10

# ─── Step 4: Create or update Lambda ─────────────────────────────────────────
echo ""
ENV_VARS="Variables={JWT_SECRET=$JWT_SECRET,DB_HOST=$DB_HOST,DB_NAME=$DB_NAME,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASSWORD,DB_PORT=$DB_PORT}"

if aws lambda get-function --function-name "$LAMBDA_NAME" --region "$AWS_REGION" > /dev/null 2>&1; then
  echo "🔄 Lambda already exists — updating code and config..."

  aws lambda update-function-code \
    --function-name "$LAMBDA_NAME" \
    --zip-file "fileb://$ZIP_PATH" \
    --region "$AWS_REGION" > /dev/null

  aws lambda wait function-updated \
    --function-name "$LAMBDA_NAME" \
    --region "$AWS_REGION"

  aws lambda update-function-configuration \
    --function-name "$LAMBDA_NAME" \
    --environment "$ENV_VARS" \
    --region "$AWS_REGION" > /dev/null

else
  echo "🚀 Creating Lambda: $LAMBDA_NAME..."

  # Build VPC config as JSON to avoid subnet ID formatting issues
  SUBNET_JSON=$(echo "$SUBNET_IDS" | tr ',' '\n' | sed 's/.*/"&"/' | tr '\n' ',' | sed 's/,$//')
  SG_JSON=$(echo "$SECURITY_GROUP_IDS" | tr ',' '\n' | sed 's/.*/"&"/' | tr '\n' ',' | sed 's/,$//')

  aws lambda create-function \
    --function-name "$LAMBDA_NAME" \
    --runtime "nodejs20.x" \
    --role "$ROLE_ARN" \
    --handler "deals.handler" \
    --zip-file "fileb://$ZIP_PATH" \
    --environment "$ENV_VARS" \
    --timeout 30 \
    --memory-size 256 \
    --vpc-config "{\"SubnetIds\":[$SUBNET_JSON],\"SecurityGroupIds\":[$SG_JSON]}" \
    --region "$AWS_REGION" > /dev/null
fi

echo "   ✅ Lambda deployed"

LAMBDA_ARN="arn:aws:lambda:$AWS_REGION:$AWS_ACCOUNT_ID:function:$LAMBDA_NAME"

# ─── Step 5: API Gateway ──────────────────────────────────────────────────────
echo ""
echo "🌐 Wiring up API Gateway routes..."

ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id "$API_GATEWAY_ID" \
  --region "$AWS_REGION" \
  --query "items[?path=='/'].id" \
  --output text)

DEALS_ID=$(aws apigateway get-resources \
  --rest-api-id "$API_GATEWAY_ID" \
  --region "$AWS_REGION" \
  --query "items[?path=='/deals'].id" \
  --output text)

if [ -z "$DEALS_ID" ]; then
  DEALS_ID=$(aws apigateway create-resource \
    --rest-api-id "$API_GATEWAY_ID" \
    --parent-id "$ROOT_ID" \
    --path-part "deals" \
    --region "$AWS_REGION" \
    --query "id" \
    --output text)
  echo "   ✅ Created /deals resource"
else
  echo "   ℹ️  /deals resource already exists"
fi

DEALS_ID_RESOURCE=$(aws apigateway get-resources \
  --rest-api-id "$API_GATEWAY_ID" \
  --region "$AWS_REGION" \
  --query "items[?path=='/deals/{id}'].id" \
  --output text)

if [ -z "$DEALS_ID_RESOURCE" ]; then
  DEALS_ID_RESOURCE=$(aws apigateway create-resource \
    --rest-api-id "$API_GATEWAY_ID" \
    --parent-id "$DEALS_ID" \
    --path-part "{id}" \
    --region "$AWS_REGION" \
    --query "id" \
    --output text)
  echo "   ✅ Created /deals/{id} resource"
else
  echo "   ℹ️  /deals/{id} resource already exists"
fi

LAMBDA_URI="arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"

# Helper: Lambda proxy integration
add_method() {
  local RESOURCE_ID=$1
  local HTTP_METHOD=$2
  local LABEL=$3

  aws apigateway put-method \
    --rest-api-id "$API_GATEWAY_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method "$HTTP_METHOD" \
    --authorization-type "NONE" \
    --region "$AWS_REGION" > /dev/null 2>&1 || true

  aws apigateway put-integration \
    --rest-api-id "$API_GATEWAY_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method "$HTTP_METHOD" \
    --type "AWS_PROXY" \
    --integration-http-method "POST" \
    --uri "$LAMBDA_URI" \
    --region "$AWS_REGION" > /dev/null 2>&1 || true

  echo "   ✅ $HTTP_METHOD /$LABEL"
}

# Helper: OPTIONS as MOCK — CORS preflight never touches Lambda
add_options() {
  local RESOURCE_ID=$1
  local LABEL=$2

  aws apigateway put-method \
    --rest-api-id "$API_GATEWAY_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method "OPTIONS" \
    --authorization-type "NONE" \
    --region "$AWS_REGION" > /dev/null 2>&1 || true

  aws apigateway put-integration \
    --rest-api-id "$API_GATEWAY_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method "OPTIONS" \
    --type "MOCK" \
    --request-templates '{"application/json":"{\"statusCode\":200}"}' \
    --region "$AWS_REGION" > /dev/null 2>&1 || true

  aws apigateway put-method-response \
    --rest-api-id "$API_GATEWAY_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method "OPTIONS" \
    --status-code "200" \
    --response-parameters '{
      "method.response.header.Access-Control-Allow-Origin": false,
      "method.response.header.Access-Control-Allow-Headers": false,
      "method.response.header.Access-Control-Allow-Methods": false
    }' \
    --region "$AWS_REGION" > /dev/null 2>&1 || true

  aws apigateway put-integration-response \
    --rest-api-id "$API_GATEWAY_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method "OPTIONS" \
    --status-code "200" \
    --response-parameters '{
      "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'",
      "method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,Authorization'"'"'",
      "method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,PATCH,DELETE,OPTIONS'"'"'"
    }' \
    --region "$AWS_REGION" > /dev/null 2>&1 || true

  echo "   ✅ OPTIONS /$LABEL (mock)"
}

add_method "$DEALS_ID"          "GET"    "deals"
add_method "$DEALS_ID"          "POST"   "deals"
add_options "$DEALS_ID"         "deals"
add_method "$DEALS_ID_RESOURCE" "PATCH"  "deals/{id}"
add_method "$DEALS_ID_RESOURCE" "DELETE" "deals/{id}"
add_options "$DEALS_ID_RESOURCE" "deals/{id}"

# Grant API Gateway permission to invoke the Lambda
aws lambda add-permission \
  --function-name "$LAMBDA_NAME" \
  --statement-id "apigateway-deals" \
  --action "lambda:InvokeFunction" \
  --principal "apigateway.amazonaws.com" \
  --source-arn "arn:aws:execute-api:$AWS_REGION:$AWS_ACCOUNT_ID:$API_GATEWAY_ID/*/*/deals*" \
  --region "$AWS_REGION" > /dev/null 2>&1 || true

# Deploy the API
echo ""
echo "🚀 Deploying API Gateway stage: $API_GATEWAY_STAGE..."
aws apigateway create-deployment \
  --rest-api-id "$API_GATEWAY_ID" \
  --stage-name "$API_GATEWAY_STAGE" \
  --region "$AWS_REGION" > /dev/null

echo ""
echo "✅ Done! Your endpoints:"
echo "   GET    https://$API_GATEWAY_ID.execute-api.$AWS_REGION.amazonaws.com/$API_GATEWAY_STAGE/deals"
echo "   POST   https://$API_GATEWAY_ID.execute-api.$AWS_REGION.amazonaws.com/$API_GATEWAY_STAGE/deals"
echo "   PATCH  https://$API_GATEWAY_ID.execute-api.$AWS_REGION.amazonaws.com/$API_GATEWAY_STAGE/deals/{id}"
echo "   DELETE https://$API_GATEWAY_ID.execute-api.$AWS_REGION.amazonaws.com/$API_GATEWAY_STAGE/deals/{id}"
echo ""
echo "📋 Next steps:"
echo "   1. Copy the base URL above into your frontend API_BASE constant"
echo "   2. Make sure your RDS security group allows inbound on port $DB_PORT from the Lambda's security group"
echo "   3. Copy db.ts from your login Lambda into deals-lambda/src/"