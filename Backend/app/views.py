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
    if "parts" in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain' and 'data' in part['body']:
                return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
    
    if "body" in payload and 'data' in payload['body']:
         return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')

    return "" # Return empty string if no body is found

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
    Initiates the Google OAuth flow.
    """
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

    auth_url, _ = flow.authorization_url(access_type='offline', prompt='consent')
    return redirect(auth_url)

    
# In Backend/app/views.py

def google_callback(request):
    """
    Handles the callback from Google, exchanges the code for tokens,
    and saves them to the user's profile.
    """
    code = request.GET.get("code")

    # --- FIX: The configuration dictionary now includes all required keys ---
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
    # ---------------------------------------------------------------------

    try:
        flow.fetch_token(code=code)
        credentials = flow.credentials

        # Get user's email from Google to identify them in our database
        gmail_service = build('gmail', 'v1', credentials=credentials)
        profile = gmail_service.users().getProfile(userId='me').execute()
        email = profile['emailAddress']
        
        # Save the tokens to the existing user's profile
        user = BasicInfo.objects.get(email=email)
        user.google_access_token = credentials.token
        user.google_refresh_token = credentials.refresh_token
        user.save()

    except BasicInfo.DoesNotExist:
        # This case is unlikely if user registers first, but handles it gracefully
        return redirect("http://localhost:5173/register?error=notfound") # Redirect with an error
    except Exception as e:
        print(f"Error during Google callback: {e}")
        # Redirect to an error page or home page on failure
        return redirect("http://localhost:5173/?error=auth_failed") 

    # On success, redirect to the user's account page
    return redirect("http://localhost:5173/account")

@csrf_exempt
def manual_sync(request):
    """
    Manually triggers a transactional email sync for the logged-in user.
    """
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)

    try:
        data = json.loads(request.body)
        uid = data.get('uid')
        if not uid:
            return JsonResponse({'status': 'error', 'message': 'User UID is required.'}, status=400)
        
        user = BasicInfo.objects.get(firebase_uid=uid)
        
        if not user.google_access_token:
            return JsonResponse({
                'status': 'error', 
                'message': 'Google account not connected. Please connect your account first.'
            }, status=400)

        # Build credentials and Gmail service
        creds = Credentials(
            token=user.google_access_token,
            refresh_token=user.google_refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET
        )
        service = build('gmail', 'v1', credentials=creds)

        # Fetch emails
        after_date = user.last_email_sync.strftime("%Y/%m/%d") if user.last_email_sync else "2024/01/01"
        query = f"after:{after_date} (invoice OR receipt OR credited OR debited OR payment OR spent)"
        results = service.users().messages().list(userId='me', q=query, maxResults=50).execute()
        messages = results.get('messages', [])

        saved_count = 0
        for msg in messages:
            msg_data = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
            email_body = get_email_body(msg_data['payload']) or msg_data.get('snippet', '')
            
            # --- Parse Transaction Details ---
            transaction_type = 'debited' if any(k in email_body.lower() for k in ['debited', 'spent', 'paid', 'sent']) else 'credited'
            amount_match = re.search(r'(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)', email_body, re.IGNORECASE)
            
            if not amount_match: continue
            amount = float(amount_match.group(1).replace(',', ''))

            # --- Prevent Duplicates ---
            transaction_date = datetime.datetime.fromtimestamp(int(msg_data['internalDate']) / 1000, tz=datetime.timezone.utc)
            if Transaction.objects.filter(user=user, amount=amount, date__date=transaction_date.date()).exists():
                continue

            Transaction.objects.create(
                user=user,
                transaction_type=transaction_type,
                amount=amount,
                description=email_body[:255],
                date=transaction_date,
            )
            saved_count += 1
        
        user.last_email_sync = datetime.datetime.now(datetime.timezone.utc)
        user.save()

        return JsonResponse({'status': 'success', 'message': f"Sync complete. Found {saved_count} new transaction(s)."})

    except BasicInfo.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'User not found.'}, status=404)
    except HttpError as e:
        return JsonResponse({'status': 'error', 'message': f'A Google API error occurred: {e}'}, status=500)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'An unexpected error occurred: {str(e)}'}, status=500)