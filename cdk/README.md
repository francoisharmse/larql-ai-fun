# AWS CDK Infrastructure as Code

This directory contains the AWS CDK code for deploying infrastructure for the Makerspace3D project.

## Prerequisites

- AWS CLI configured
- Node.js and npm installed
- Python 3.8+ installed
- AWS CDK Toolkit installed (`npm install -g aws-cdk`)

## Setup

1. Create and activate a virtual environment:
```
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```
pip install -r requirements.txt
```

3. Bootstrap your AWS environment (if not already done):
```
cdk bootstrap aws://<ACCOUNT-NUMBER>/<REGION>
```

## Deployment

To deploy the infrastructure:
```
cdk deploy
```

To destroy the infrastructure:
```
cdk destroy
```
