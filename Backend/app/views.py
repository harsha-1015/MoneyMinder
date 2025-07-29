import json
import re
import base64
import datetime

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum, Q
from django.db.models.functions import TruncMonth

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import google.generativeai as genai

from .models import BasicInfo, Transaction

# --- Configuration ---
if hasattr(settings, 'GEMINI_API_KEY'):
    genai.configure(api_key=settings.GEMINI_API_KEY)

# --- Helper Functions ---
def get_email_body(payload):
    """
    Recursively search for the email body in plain text or HTML and
    decode it from base64. Prefers plain text.
    """
    if 'parts' in payload:
        for part in payload['parts']:
            # Handle multipart/alternative (common for emails with both text and HTML)
            if part['mimeType'].startswith('multipart/'):
                result = get_email_body(part)
                if result:
                    return result
            # Prefer plain text
            elif part['mimeType'] == 'text/plain':
                data = part['body'].get('data', '')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
        # If no plain text, try HTML
        for part in payload['parts']:
            if part['mimeType'] == 'text/html':
                data = part['body'].get('data', '')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
    
    # If no parts or no text/plain part, try to get the body directly
    if 'body' in payload and 'data' in payload['body'] and payload['body']['data']:
        return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
    
    return ""

def extract_transaction_details(email_body, msg_data):
    """
    Extract transaction details from email body.
    Returns a dictionary with transaction details or None if no transaction found.
    """
    if not email_body:
        return None
        
    # Convert to lowercase once
    email_lower = email_body.lower()
    
    # Check if this is likely a financial email
    financial_keywords = [
        'paid', 'payment', 'received', 'sent', 'transfer', 'transaction',
        'invoice', 'bill', 'receipt', 'statement', 'purchase', 'order',
        'refund', 'cashback', 'reward', 'cash', 'rs.', 'inr', '₹', 'debit', 'credit',
        'bank', 'upi', 'card', 'wallet', 'payment', 'settlement', 'clear'
    ]
    
    # If no financial keywords found, skip this email
    if not any(keyword in email_lower for keyword in financial_keywords):
        return None
    
    # Determine transaction type
    debit_indicators = ['debited', 'spent', 'paid', 'sent', 'purchase', 'withdrawn']
    credit_indicators = ['credited', 'received', 'refund', 'deposit', 'cashback', 'reward']
    
    transaction_type = 'debited' if any(k in email_lower for k in debit_indicators) else 'credited'
    if any(k in email_lower for k in credit_indicators):
        transaction_type = 'credited'
    
    # Extract amount using various patterns
    amount = None
    amount_patterns = [
        r'(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)',  # Rs. 1,234.56 or ₹1,234.56
        r'amount\s*[\:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)',  # Amount: Rs. 1,234.56
        r'total\s*[\:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)',  # Total: ₹1,234.56
        r'(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:only|rs\.?|inr|₹)?',  # ₹1,234.56 only
    ]
    
    for pattern in amount_patterns:
        match = re.search(pattern, email_lower, re.IGNORECASE)
        if match:
            try:
                amount = float(match.group(1).replace(',', ''))
                break
            except (ValueError, AttributeError):
                continue
    
    if amount is None:
        return None
    
    # Extract date (use email date as fallback)
    transaction_date = datetime.datetime.fromtimestamp(
        int(msg_data['internalDate']) / 1000, 
        tz=datetime.timezone.utc
    )
    
    # Try to find a better date in the email body
    date_patterns = [
        r'(?:date|on)\s*[\:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',  # DD/MM/YYYY or DD-MM-YYYY
        r'(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})',  # 1st Jan 2023
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, email_body, re.IGNORECASE)
        if match:
            try:
                # Try to parse the matched date
                from dateutil import parser
                parsed_date = parser.parse(match.group(1), dayfirst=True)
                if parsed_date:
                    transaction_date = parsed_date.replace(tzinfo=datetime.timezone.utc)
                    break
            except:
                continue
    
    # Extract description (first line or a relevant part)
    description = email_body.split('\n')[0][:255]  # First line, max 255 chars
    
    return {
        'type': transaction_type,
        'amount': amount,
        'date': transaction_date,
        'description': description,
        'raw_body': email_body
    }

# --- API Views ---

@csrf_exempt
def register_user(request):
    """
    Creates a user profile in the database after successful 
    Firebase registration on the frontend.
    """
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)
    
    try:
        data = json.loads(request.body)
        # Ensure UID is present
        if not data.get('firebase_uid'):
            return JsonResponse({'status': 'error', 'message': 'Firebase UID is required.'}, status=400)

        # Create the user profile
        BasicInfo.objects.create(
            firebase_uid=data.get('firebase_uid'),
            full_name=data.get('full_name'),
            email=data.get('email'),
            occupation=data.get('occupation'),
            salary=data.get('salary'),
            marital_status=data.get('marital_status'),
            gender=data.get('gender'),
        )
        return JsonResponse({"status": "success", "message": "Profile created successfully."})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


@csrf_exempt
def get_user(request):
    """
    Retrieves user profile details from the database.
    """
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)
    
    try:
        data = json.loads(request.body)
        uid = data.get('uid')
        if not uid:
            return JsonResponse({'status': 'error', 'message': 'User UID is required.'}, status=400)

        user = BasicInfo.objects.get(firebase_uid=uid)
        return JsonResponse({
            'full_name': user.full_name,
            'email': user.email,
            'gender': user.gender,
            'occupation': user.occupation,
            'salary': user.salary,
            'marital_status': user.marital_status,
            'google_access_token': user.google_access_token
        })
    except BasicInfo.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'User not found.'}, status=404)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@csrf_exempt
def get_financial_analysis(request):
    """
    Performs AI-powered categorization and generates financial insights 
    based on the user's transaction history.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests are allowed'}, status=405)

    try:
        data = json.loads(request.body)
        uid = data.get('uid')
        if not uid:
            return JsonResponse({'error': 'UID is required.'}, status=400)
        
        user = BasicInfo.objects.get(firebase_uid=uid)
        transactions = Transaction.objects.filter(user=user)

        if not transactions.exists():
            return JsonResponse({
                'message': 'No transactions found. Sync your emails to get started!',
                'transactions': [],
                'ai_insights': "I can't provide any analysis without transaction data. Please sync your emails to get started."
            })

    except BasicInfo.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    # --- Step 1: Categorize Uncategorized Transactions ---
    uncategorized_transactions = transactions.filter(category__isnull=True)
    if uncategorized_transactions.exists():
        categories_list = ["Food & Dining", "Transport", "Shopping", "Bills & Utilities", "Entertainment", "Health & Wellness", "Groceries", "Income", "Transfers", "Other"]
        descriptions = [t.description for t in uncategorized_transactions]
        
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            formatted_descriptions = "\n- ".join(descriptions)
            prompt = (f"Categorize each of these transaction descriptions into one of these categories: {', '.join(categories_list)}. "
                      f"Return only a comma-separated list of categories. Descriptions:\n- {formatted_descriptions}")
            
            response = model.generate_content(prompt)
            ai_categories = [cat.strip() for cat in response.text.split(',')]

            for i, transaction in enumerate(uncategorized_transactions):
                if i < len(ai_categories) and ai_categories[i] in categories_list:
                    transaction.category = ai_categories[i]
                    transaction.save()
        except Exception as e:
            print(f"AI categorization failed: {e}") 

    # --- Step 2: Aggregate Data for Charts ---
    pie_data = transactions.aggregate(
        total_credited=Sum('amount', filter=Q(transaction_type='credited')),
        total_debited=Sum('amount', filter=Q(transaction_type='debited'))
    )
    category_spending = (
        transactions.filter(transaction_type='debited')
        .values('category')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )

    # --- Step 3: Generate AI Insights ---
    ai_insights = "Could not generate AI insights at this time."
    try:
        income = pie_data.get('total_credited') or 0
        expenses = pie_data.get('total_debited') or 0
        category_summary = ", ".join([f"{item['category']}: Rs.{item['total']:.2f}" for item in category_spending])
        overspend_alert = "Your spending is high compared to your income. Consider reviewing your expenses." if user.salary and expenses > (user.salary * 0.8) else ""

        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = (f"You are a friendly financial advisor in India. User's Monthly Salary: Rs.{user.salary}. "
                  f"This Period's Income: Rs.{income:.2f}, Expenses: Rs.{expenses:.2f}. "
                  f"Spending by category: {category_summary}. {overspend_alert} "
                  f"Provide 2-3 short, actionable suggestions to help them manage their finances better. Format as a single block of text.")
        
        response = model.generate_content(prompt)
        ai_insights = response.text

    except Exception as e:
        print(f"AI insight generation failed: {e}")

    # --- Step 4: Consolidate and Respond ---
    return JsonResponse({
        'pie_chart_data': {
            'credited': pie_data.get('total_credited') or 0,
            'debited': pie_data.get('total_debited') or 0,
        },
        'bar_chart_data': list(category_spending),
        'transactions': list(transactions.order_by('-date').values()),
        'ai_insights': ai_insights
    }, safe=False)

# --- Google OAuth and Sync Views ---

def connect_google(request):
    """
    Initiates the Google OAuth flow with Firebase UID in state.
    """
    firebase_uid = request.GET.get('uid')
    if not firebase_uid:
        return JsonResponse({"status": "error", "message": "Firebase UID is required"}, status=400)
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=["https://www.googleapis.com/auth/gmail.readonly"],
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )

    # Include the Firebase UID in the state parameter
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        prompt='consent',
        state=firebase_uid,  # Pass the UID in the state parameter
        include_granted_scopes='true'
    )
    
    print(f"[DEBUG] Initiating Google OAuth for UID: {firebase_uid}")
    return redirect(auth_url)

    
# In Backend/app/views.py

def google_callback(request):
    """
    Handles the callback from Google, exchanges the code for tokens,
    and saves them to the user's profile using Firebase UID.
    """
    # print("[DEBUG] Google callback received")
    code = request.GET.get("code")
    firebase_uid = request.GET.get("state")  # Get UID from state parameter
    
    if not code:
        print("[ERROR] No code parameter in request")
        return redirect("http://localhost:5173/?error=no_code")
        
    if not firebase_uid:
        print("[ERROR] No Firebase UID in request")
        return redirect("http://localhost:5173/?error=no_uid")

    try:
        # Initialize the OAuth flow
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=["https://www.googleapis.com/auth/gmail.readonly"],
            redirect_uri=settings.GOOGLE_REDIRECT_URI,
        )

        # Exchange the authorization code for tokens
        flow.fetch_token(code=code)
        credentials = flow.credentials

        if not credentials or not credentials.token:
            print("[ERROR] Failed to obtain access token")
            return redirect("http://localhost:5173/?error=token_failure")

        # print(f"[DEBUG] Successfully obtained OAuth tokens")

        # Get user's email from Google to identify them in our database
        gmail_service = build('gmail', 'v1', credentials=credentials)
        profile = gmail_service.users().getProfile(userId='me').execute()
        email = profile['emailAddress']

        # print(f"[DEBUG] Google email: {email}")
        # print(f"[DEBUG] Access token: {credentials.token[:10]}...")  
        # print(f"[DEBUG] Refresh token: {'Present' if credentials.refresh_token else 'Not provided'}")

        # Try to find the user by Firebase UID
        try:
            user = BasicInfo.objects.get(firebase_uid=firebase_uid)
            # print(f"[DEBUG] Found user with UID: {firebase_uid}")
            
            # Update user's tokens, email, and sync time
            user.google_access_token = credentials.token
            user.google_refresh_token = credentials.refresh_token
            user.email = email  # Update email in case it changed
            user.last_email_sync = datetime.datetime.now(datetime.timezone.utc)
            user.save(update_fields=[
                'google_access_token', 
                'google_refresh_token', 
                'email',
                'last_email_sync'
            ])
            
            print(f"[DEBUG] Successfully updated user tokens and sync time")
            return redirect("http://localhost:5173/?google_connected=1")

        except BasicInfo.DoesNotExist:
            # print(f"[ERROR] No user found with Firebase UID: {firebase_uid}")
            return redirect("http://localhost:5173/register?error=user_not_found")

    except Exception as e:
        print(f"[ERROR] Google callback error: {str(e)}")
        import traceback
        traceback.print_exc()
        return redirect(f"http://localhost:5173/?error=auth_failed&details={str(e)}")
@csrf_exempt
def manual_sync(request):
    """
    Manually triggers a transactional email sync for the logged-in user.
    """
    print("[DEBUG] Manual sync request received")
    
    if request.method != 'POST':
        print("[ERROR] Invalid request method")
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)

    try:
        # Parse request data
        try:
            data = json.loads(request.body)
            uid = data.get('uid')
            if not uid:
                raise ValueError('User UID is required')
        except json.JSONDecodeError:
            print("[ERROR] Invalid JSON in request body")
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
        except Exception as e:
            print(f"[ERROR] Error parsing request: {str(e)}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
        
        print(f"[DEBUG] Processing sync for UID: {uid}")
        
        try:
            user = BasicInfo.objects.get(firebase_uid=uid)
        except BasicInfo.DoesNotExist:
            print(f"[ERROR] User not found with UID: {uid}")
            return JsonResponse({'status': 'error', 'message': 'User not found.'}, status=404)
        
        print(f"[DEBUG] Found user: {user.email}")
        
        if not user.google_access_token or not user.google_refresh_token:
            print("[ERROR] Google account not connected")
            return JsonResponse({
                'status': 'error', 
                'message': 'Google account not connected. Please connect your account first.'
            }, status=400)

        try:
            # Build credentials and Gmail service
            print("[DEBUG] Building Google credentials")
            creds = Credentials(
                token=user.google_access_token,
                refresh_token=user.google_refresh_token,
                token_uri='https://oauth2.googleapis.com/token',
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                scopes=['https://www.googleapis.com/auth/gmail.readonly']
            )
            
            # Try to refresh the token if it's expired
            if creds.expired and creds.refresh_token:
                print("[DEBUG] Refreshing access token")
                request = google.auth.transport.requests.Request()
                creds.refresh(request)
                
                # Update the tokens in the database
                user.google_access_token = creds.token
                user.save(update_fields=['google_access_token'])
                print("[DEBUG] Successfully refreshed access token")

            service = build('gmail', 'v1', credentials=creds)
            print("[DEBUG] Gmail service built successfully")

            # Fetch emails with a broader query since we'll filter more carefully in the processing
            after_date = user.last_email_sync.strftime("%Y/%m/%d") if user.last_email_sync else "2024/01/01"
            query = f"after:{after_date}"  # Broader query since we'll filter in code
            print(f"[DEBUG] Fetching emails after {after_date}")
            
            # Get message IDs first
            results = service.users().messages().list(
                userId='me', 
                q=query, 
                maxResults=100,  # Increased limit to process more emails
                includeSpamTrash=False
            ).execute()
            messages = results.get('messages', [])
            print(f"[DEBUG] Found {len(messages)} messages to process")

            saved_count = 0
            for i, msg in enumerate(messages, 1):
                try:
                    print(f"[DEBUG] Processing message {i}/{len(messages)}")
                    
                    # Get full message data
                    msg_data = service.users().messages().get(
                        userId='me', 
                        id=msg['id'], 
                        format='full'
                    ).execute()
                    
                    # Extract email body with improved processing
                    email_body = get_email_body(msg_data['payload']) or msg_data.get('snippet', '')
                    
                    if not email_body:
                        print(f"[DEBUG] Skipping empty message {msg['id']}")
                        continue
                    
                    # Extract transaction details using the enhanced function
                    transaction = extract_transaction_details(email_body, msg_data)
                    if not transaction:
                        print(f"[DEBUG] No transaction details found in message {msg['id']}")
                        continue
                    
                    # Check for duplicates (now using a time window to catch similar transactions)
                    time_window = datetime.timedelta(hours=24)
                    duplicate = Transaction.objects.filter(
                        user=user, 
                        amount=transaction['amount'],
                        date__range=(
                            transaction['date'] - time_window,
                            transaction['date'] + time_window
                        )
                    ).exists()
                    
                    if duplicate:
                        print(f"[DEBUG] Duplicate transaction found for amount {transaction['amount']} around {transaction['date']}")
                        continue
                    
                    # Create new transaction with extracted details
                    Transaction.objects.create(
                        user=user,
                        transaction_type=transaction['type'],
                        amount=transaction['amount'],
                        description=transaction['description'],
                        date=transaction['date'],
                        raw_data=json.dumps({
                            'subject': next((h['value'] for h in msg_data.get('payload', {}).get('headers', []) 
                                          if h.get('name', '').lower() == 'subject'), ''),
                            'from': next((h['value'] for h in msg_data.get('payload', {}).get('headers', []) 
                                        if h.get('name', '').lower() == 'from'), ''),
                            'snippet': msg_data.get('snippet', '')
                        })
                    )
                    saved_count += 1
                    print(f"[DEBUG] Saved transaction: {transaction['type']} ₹{transaction['amount']} on {transaction['date']}")
                    
                except Exception as e:
                    print(f"[ERROR] Error processing message {msg.get('id', 'unknown')}: {str(e)}")
                    continue
            
            # Update last sync time
            user.last_email_sync = datetime.datetime.now(datetime.timezone.utc)
            user.save(update_fields=['last_email_sync'])
            print(f"[DEBUG] Sync completed. Saved {saved_count} new transactions")

            return JsonResponse({
                'status': 'success', 
                'message': f"Sync complete. Found {saved_count} new transaction(s)."
            })

        except HttpError as e:
            error_details = f"Status: {e.resp.status}, Content: {e.content.decode()}" if hasattr(e, 'resp') else str(e)
            print(f"[ERROR] Google API error: {error_details}")
            return JsonResponse({
                'status': 'error', 
                'message': 'Failed to sync with Google. Please try reconnecting your Google account.',
                'details': str(e)
            }, status=500)
            
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] Unexpected error in manual_sync: {str(e)}\n{error_trace}")
        return JsonResponse({
            'status': 'error', 
            'message': 'An unexpected error occurred during sync.',
            'details': str(e)
        }, status=500)