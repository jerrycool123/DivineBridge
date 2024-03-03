#!/bin/bash
export $(cat .aws.env | xargs)
serverless config credentials --provider "aws" -o --key "${AWS_ACCESS_KEY_ID}" --secret "${AWS_SECRET_ACCESS_KEY}"
