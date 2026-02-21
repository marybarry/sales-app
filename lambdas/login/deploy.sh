#!/bin/bash

# ============================================
# CONFIGURATION
# ============================================
 
# ============================================
# BUILD AND DEPLOY
# ============================================

echo "Building TypeScript..."
npm run build

if [ ! -d "dist" ]; then
    echo "Build failed - dist directory not found"
    exit 1
fi

echo "Installing production dependencies..."
npm install --production

echo "Creating deployment package..."
cd dist
zip -r ../function.zip .
cd ..

# Add node_modules to zip
zip -r function.zip node_modules

echo "Checking if function exists..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $AWS_REGION 2>/dev/null; then
    echo "Updating existing function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://function.zip \
        --region $AWS_REGION

    echo "Updating environment variables..."
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --environment "Variables={
            DB_HOST=$DB_HOST,
            DB_PORT=$DB_PORT,
            DB_NAME=$DB_NAME,
            DB_USER=$DB_USER,
            DB_PASSWORD=$DB_PASSWORD
        }" \
        --region $AWS_REGION
else
    echo "Creating new function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler login.handler \
        --zip-file fileb://function.zip \
        --timeout 30 \
        --memory-size 512 \
        --vpc-config SubnetIds=$SUBNET_IDS,SecurityGroupIds=$SECURITY_GROUP_IDS \
        --environment "Variables={
            DB_HOST=$DB_HOST,
            DB_PORT=$DB_PORT,
            DB_NAME=$DB_NAME,
            DB_USER=$DB_USER,
            DB_PASSWORD=$DB_PASSWORD
        }" \
        --region $AWS_REGION
fi

echo "✓ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Create API Gateway"
echo "2. Connect /login endpoint to this Lambda function"
echo "3. Enable CORS on API Gateway"
echo "4. Deploy API to a stage"