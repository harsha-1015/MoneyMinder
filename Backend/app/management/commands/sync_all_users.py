import datetime
import re
from django.core.management.base import BaseCommand
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from django.conf import settings
from app.models import BasicInfo, Transaction

def sync_user_emails(user, access_token, refresh_token):
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri='https://oauth2.googleapis.com/token',
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET
    )

    service = build('gmail', 'v1', credentials=creds)

    # Use last sync time or default to financial year start
    if user.last_email_sync:
        after_date = user.last_email_sync.strftime("%Y/%m/%d")
    else:
        after_date = datetime.date(2024, 4, 1).strftime("%Y/%m/%d")

    query = f"after:{after_date} (invoice OR bank OR receipt OR credited OR debited)"
    results = service.users().messages().list(userId='me', q=query, maxResults=20).execute()
    messages = results.get('messages', [])

    saved = 0

    for msg in messages:
        msg_data = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
        headers = msg_data['payload']['headers']
        snippet = msg_data.get('snippet', '')
        snippet_lower = snippet.lower()

        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')
        sender = next((h['value'] for h in headers if h['name'] == 'From'), '')

        if 'credited' in snippet_lower:
            transaction_type = 'credited'
        elif 'debited' in snippet_lower:
            transaction_type = 'debited'
        else:
            transaction_type = 'unknown'

        amount_match = re.search(r'₹\s?[\d,]+(?:\.\d{2})?', snippet)
        amount = amount_match.group() if amount_match else '0'
        amount_float = float(amount.replace('₹', '').replace(',', '')) if amount else 0

        source_match = re.search(r'(?:by|from)\s([A-Za-z0-9 &@.-]+)', snippet)
        source = source_match.group(1).strip() if source_match else 'Unknown'

        account_match = re.search(r'A/c\s*([Xx*#\d]+)', snippet)
        account = account_match.group(1) if account_match else 'Not found'

        # Save to DB
        Transaction.objects.create(
            user=user,
            transaction_type=transaction_type,
            amount=amount_float,
            source=source,
            account=account,
            description=snippet,
            category=None
        )

        saved += 1

    # Update last sync time
    user.last_email_sync = datetime.datetime.now()
    user.save()

    return saved


class Command(BaseCommand):
    help = 'Sync Gmail emails for all users with Gmail tokens'

    def handle(self, *args, **kwargs):
        users = BasicInfo.objects.exclude(google_access_token__isnull=True).exclude(google_refresh_token__isnull=True)
        total_saved = 0

        for user in users:
            try:
                self.stdout.write(f"Syncing for {user.email}...")
                saved = sync_user_emails(user, user.google_access_token, user.google_refresh_token)
                self.stdout.write(self.style.SUCCESS(f"{saved} transactions saved for {user.email}"))
                total_saved += saved
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error syncing {user.email}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS(f" All done. Total new transactions saved: {total_saved}"))
