#!/bin/bash
export $(cat .aws.env | xargs)
serverless config credentials --provider "aws" --key "${AWS_ACCESS_KEY_ID}" --secret "${AWS_SECRET_ACCESS_KEY}"
