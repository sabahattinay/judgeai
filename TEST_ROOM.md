# Test Room Access

## Create a room and test access:

1. Open browser to: http://localhost:3000/create

2. Click "Create Dispute Room"

3. Copy one of the generated links (User A or User B)

4. Open that link in a new tab

## Expected Result:
- Room should load with submission form

## If you see "Missing access token":
- Make sure you copied the COMPLETE link including the ?token=... part
- The link should look like: http://localhost:3000/room/ROOM_ID?token=TOKEN_VALUE

## Quick Test Link:
Run this in terminal to create a room and get links:

```bash
curl -s -X POST http://localhost:3000/api/create-room \
  -H "Content-Type: application/json" \
  -d '{"title":"Quick Test"}' | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print('User A:', data['userALink']); print('User B:', data['userBLink'])"
```

Then copy one of those links and paste in browser.
