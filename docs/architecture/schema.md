# Database Schema

## leads
id
workspace_id
name
email
phone
source
campaign
lead_score
status
assigned_user_id
created_at

## funnels
id
workspace_id
name
slug
status

## form_submissions
id
form_id
lead_id
payload_json
utm_json

## pipelines
id
workspace_id
name

## pipeline_stages
id
pipeline_id
name
order_index

## messages
id
lead_id
channel
direction
body
status

## automations
id
workspace_id
trigger_type
conditions_json
actions_json

## appointments
id
lead_id
start_at
status

## revenue_events
id
lead_id
amount
status
