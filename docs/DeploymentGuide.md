# Deployment Guide

It is very simple to deploy this app into your own AWS account. It uses Amplify's one click deployment feature.

## Deployment
<hr/>

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) .

## Installation

Follow these instructions to deploy the frontend:

1) Use the provided **1-click deployment** button below.
2) Select **Connect to GitHub**, and then you will be asked to connect to your GitHub account. Amplify Console will fork this repository into your GitHub account before deploying.
3) Select your AWS service role in the dropdown. If you don't have one configured, Select 'Create new role' and quickly create one using the default settings.
4) Click Save and Deploy, and wait for deployment to complete in the Amplify console. This may take some time to complete.


[![One-click deployment](https://oneclick.amplifyapp.com/button.svg)](https://console.aws.amazon.com/amplify/home#/deploy?repo=https://github.com/UBC-CIC/Amazon-Location-Template)

## Logging in

Cognito is used for user authentication. Users will need to input their email address and a password to create an account.
After account creation, users will need to verify their account by inputting the 6-digit verification code that was sent to their provided email address before being able to log in to the system.
