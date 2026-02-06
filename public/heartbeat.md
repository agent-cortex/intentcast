# IntentCast Heartbeat

## Provider Mode
- Check matching intents: `GET /api/v1/match/{providerId}`
- If matches found, summarize and consider offers

## Requester Mode  
- Check offers: `GET /api/v1/intents/{id}/offers`
- If good offers, prompt to accept

## Default
- If nothing needs attention: HEARTBEAT_OK
