import random
import json
import os
from django.core.mail import send_mail
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from google_auth_oauthlib.flow import Flow
from django.shortcuts import redirect
from django.conf import settings
from django.http import HttpResponse
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import datetime
import re

import base64
from bs4 import BeautifulSoup

import google.generativeai as genai
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth

#models import
from .models import BasicInfo,Transaction


# --- ADD THIS IMPORT TO REUSE YOUR SYNC FUNCTION ---
from .management.commands.sync_all_users import sync_user_emails
# --- ADD THIS IMPORT FOR BETTER ERROR HANDLING ---
from googleapiclient.errors import HttpError
# ----------------------------------------------------

if hasattr(settings, 'GEMINI_API_KEY'):
    genai.configure(api_key=settings.GEMINI_API_KEY)
# --- HELPER FUNCTION TO GET FULL EMAIL BODY ---
def get_email_body(payload):
    """
    Recursively search for the email body in plain text or HTML,
    and decode it from base64.
    """
    body = ""
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body'].get('data')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8')
            elif part['mimeType'] == 'text/html':
                data = part['body'].get('data')
                if data:
                    # Use BeautifulSoup to get clean text from HTML
                    soup = BeautifulSoup(base64.urlsafe_b64decode(data).decode('utf-8'), 'html.parser')
                    body = soup.get_text()
            # Recurse for multipart/alternative etc.
            elif 'parts' in part:
                return get_email_body(part)
    elif 'body' in payload and 'data' in payload['body']:
        data = payload['body'].get('data')
        if data:
            return base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
    return body


@csrf_exempt
def create_profile(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # Create a new user profile linked to the Firebase UID
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
    return JsonResponse({"error": "Only POST requests are allowed."}, status=405)

@csrf_exempt
def get_user_details(request):
    try:
        email=request.GET.get('email')
        try:
            user=BasicInfo.objects.get(email=email)
            return JsonResponse({
                'full_name': user.full_name,
                'email': user.email,
                'gender': user.gender,
                'occupation': user.occupation,
                'salary': user.salary,
                'marital_status': user.marital_status
            })
        except BasicInfo.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        print(e)
        return JsonResponse({"error":str(e)})
    
    
    
@csrf_exempt
def get_financial_analysis(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests are allowed'}, status=405)

    try:
        data = json.loads(request.body)
        email = data.get('email')
        if not email:
            return JsonResponse({'error': 'Email is required.'}, status=400)
        
        user = BasicInfo.objects.get(email=email)
        transactions = Transaction.objects.filter(user=user)

        if not transactions.exists():
            return JsonResponse({
                'message': 'No transactions found. Start by syncing your emails!',
                'transactions': [],
                'ai_insights': "I can't provide any analysis without your transaction data. Please sync your emails to get started."
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

    # Pie Chart Data (Total Credit vs. Debit)
    pie_data = transactions.aggregate(
        total_credited=Sum('amount', filter=Q(transaction_type='credited')),
        total_debited=Sum('amount', filter=Q(transaction_type='debited'))
    )

    # Line Chart Data (Monthly Spending)
    monthly_spending = (
        transactions.filter(transaction_type='debited')
        .annotate(month=TruncMonth('date'))
        .values('month')
        .annotate(total=Sum('amount'))
        .order_by('month')
    )

    # Bar Chart Data (Spending by Category)
    category_spending = (
        transactions.filter(transaction_type='debited')
        .values('category')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )

    # --- Step 3: Generate AI Insights ---
    ai_insights = "Could not generate AI insights at this time." # Default message
    try:
        # Prepare a summary for the AI
        income = pie_data.get('total_credited') or 0
        expenses = pie_data.get('total_debited') or 0
        category_summary = ", ".join([f"{item['category']}: Rs.{item['total']:.2f}" for item in category_spending])

        # Define the overspending rule
        overspend_alert = ""
        if user.salary and expenses > (user.salary * 0.8): # Check if salary is available
            overspend_alert = "Your spending is high compared to your income this month. It's a good idea to review your expenses."

        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = (f"You are a friendly financial advisor in India. Here is a user's summary: "
                  f"Monthly Salary: Rs.{user.salary}. Total Income this period: Rs.{income:.2f}. Total Expenses: Rs.{expenses:.2f}. "
                  f"Spending by category: {category_summary}. "
                  f"{overspend_alert} "
                  f"Based on this, provide 2-3 short, actionable suggestions to help them manage their finances better. Format the output as a single block of text.")
        
        response = model.generate_content(prompt)
        ai_insights = response.text

    except Exception as e:
        print(f"AI insight generation failed: {e}")

    # --- Step 4: Consolidate and Respond ---
    response_data = {
        'pie_chart_data': {
            'credited': pie_data.get('total_credited') or 0,
            'debited': pie_data.get('total_debited') or 0,
        },
        'line_chart_data': list(monthly_spending),
        'bar_chart_data': list(category_spending),
        'transactions': list(transactions.order_by('-date').values()),
        'ai_insights': ai_insights
    }
    
    return JsonResponse(response_data, safe=False)
        
    
def connect_google(request):
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=["https://www.googleapis.com/auth/gmail.readonly"],
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )

    auth_url, _ = flow.authorization_url(
        access_type='offline',
        prompt='consent'
    )
    return redirect(auth_url)

    
def google_callback(request):
    code = request.GET.get("code")

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=["https://www.googleapis.com/auth/gmail.readonly"],
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )

    flow.fetch_token(code=code)
    credentials = flow.credentials

    request.session['google_access_token'] = credentials.token
    request.session['google_refresh_token'] = credentials.refresh_token

    from googleapiclient.discovery import build
    gmail_service = build('gmail', 'v1', credentials=credentials)
    profile = gmail_service.users().getProfile(userId='me').execute()
    email = profile['emailAddress']

    
    try:
        user = BasicInfo.objects.get(email=email)
        user.google_access_token = credentials.token
        user.google_refresh_token = credentials.refresh_token
        user.save()
    except BasicInfo.DoesNotExist:
        pass

    return redirect("http://localhost:5173")  
        
@csrf_exempt
def read_gmail_emails(request):
    access_token = request.session.get('google_access_token')
    refresh_token = request.session.get('google_refresh_token')
    user_email = request.GET.get('email')

    if not access_token or not refresh_token:
        return JsonResponse({"error": "Google credentials not found. Please connect your Google account."}, status=401)

    if not user_email:
        return JsonResponse({"error": "User email required as query param (?email=...)"}, status=400)

    try:
        user = BasicInfo.objects.get(email=user_email)
    except BasicInfo.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)

    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri='https://oauth2.googleapis.com/token',
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET
    )

    try:
        service = build('gmail', 'v1', credentials=creds)

        financial_year_start = datetime.date(2024, 4, 1).strftime("%Y/%m/%d")
        query = f"after:{financial_year_start} (invoice OR bank OR receipt OR credited OR debited OR payment OR spent)"

        results = service.users().messages().list(userId='me', q=query, maxResults=50).execute()
        messages = results.get('messages', [])

        saved = 0
        emails = []

        if messages:
            for msg in messages:
                msg_data = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
                
                # --- UPDATED TO USE FULL BODY ---
                email_body = get_email_body(msg_data['payload'])
                if not email_body:
                    email_body = msg_data.get('snippet', '') # Fallback to snippet if body is empty
                
                body_lower = email_body.lower()
                # --------------------------------

                transaction_type = 'unknown'
                debit_keywords = ['debited', 'spent', 'paid', 'sent', 'charged', 'payment']
                credit_keywords = ['credited', 'received', 'refund']

                if any(keyword in body_lower for keyword in debit_keywords):
                    transaction_type = 'debited'
                elif any(keyword in body_lower for keyword in credit_keywords):
                    transaction_type = 'credited'

                amount_match = re.search(r'(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)', email_body, re.IGNORECASE)
                amount_str = amount_match.group(1) if amount_match else '0'
                amount_float = float(amount_str.replace(',', '')) if amount_str != '0' else 0.0

                if transaction_type != 'unknown' and amount_float > 0:
                    source = 'Unknown'
                    source_patterns = [
                        r'(?:to|at|from)\s+([\w\s.&@\'\-]+?)(?:\s+on\s|\s+for\s|\s+Ref|VPA|\.|$)',
                        r'purchase at\s+([\w\s.&@\'\-]+?)(?:\s+of\s|\.)',
                        r'payment of\s+(?:Rs\.?|INR|₹)\s*[\d,.]+\s+to\s+([\w\s.&@\'\-]+?)(?:\.|$)'
                    ]
                    for pattern in source_patterns:
                        source_match = re.search(email_body, pattern, re.IGNORECASE)
                        if source_match:
                            source = source_match.group(1).strip()
                            break

                    account_match = re.search(r'A/c\s(?:ending\s)?(?:in\s)?([Xx*#\d]+)', email_body, re.IGNORECASE)
                    account = account_match.group(1) if account_match else 'Not found'

                    Transaction.objects.create(
                        user=user,
                        transaction_type=transaction_type,
                        amount=amount_float,
                        source=source,
                        account=account,
                        description=email_body[:255], # Save a snippet of the full body
                        category=None
                    )
                    saved += 1
        
        return JsonResponse({ 'saved': saved })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def manual_sync_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            if not email:
                return JsonResponse({'status': 'error', 'message': 'Email is required.'}, status=400)
            
            user = BasicInfo.objects.get(email=email)
            
            if not user.google_access_token or not user.google_refresh_token:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Google account not connected. Please connect your account from the home page.'
                }, status=400)

            creds = Credentials(
                token=user.google_access_token,
                refresh_token=user.google_refresh_token,
                token_uri='https://oauth2.googleapis.com/token',
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET
            )

            service = build('gmail', 'v1', credentials=creds)

            if user.last_email_sync:
                after_date = user.last_email_sync.strftime("%Y/%m/%d")
            else:
                after_date = datetime.date(2024, 4, 1).strftime("%Y/%m/%d")

            query = f"after:{after_date} (invoice OR bank OR receipt OR credited OR debited OR payment OR spent)"
            results = service.users().messages().list(userId='me', q=query, maxResults=50).execute()
            messages = results.get('messages', [])

            saved_count = 0
            scanned_count = len(messages) if messages else 0

            if messages:
                for msg in messages:
                    msg_data = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
                    
                    # --- UPDATED TO USE FULL BODY ---
                    email_body = get_email_body(msg_data['payload'])
                    if not email_body:
                        email_body = msg_data.get('snippet', '')
                    
                    body_lower = email_body.lower()
                    # --------------------------------
                    
                    transaction_type = 'unknown'
                    debit_keywords = ['debited', 'spent', 'paid', 'sent', 'charged', 'payment']
                    credit_keywords = ['credited', 'received', 'refund']

                    if any(keyword in body_lower for keyword in debit_keywords):
                        transaction_type = 'debited'
                    elif any(keyword in body_lower for keyword in credit_keywords):
                        transaction_type = 'credited'

                    amount_match = re.search(r'(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)', email_body, re.IGNORECASE)
                    amount_str = amount_match.group(1) if amount_match else '0'
                    amount_float = float(amount_str.replace(',', '')) if amount_str != '0' else 0.0
                    
                    if transaction_type != 'unknown' and amount_float > 0:
                        source = 'Unknown'
                        source_patterns = [
                            r'(?:to|at|from)\s+([\w\s.&@\'\-]+?)(?:\s+on\s|\s+for\s|\s+Ref|VPA|\.|$)',
                            r'purchase at\s+([\w\s.&@\'\-]+?)(?:\s+of\s|\.)',
                            r'payment of\s+(?:Rs\.?|INR|₹)\s*[\d,.]+\s+to\s+([\w\s.&@\'\-]+?)(?:\.|$)'
                        ]
                        for pattern in source_patterns:
                            source_match = re.search(email_body, pattern, re.IGNORECASE)
                            if source_match:
                                source = source_match.group(1).strip()
                                break

                        account_match = re.search(r'A/c\s(?:ending\s)?(?:in\s)?([Xx*#\d]+)', email_body, re.IGNORECASE)
                        account = account_match.group(1) if account_match else 'Not found'

                        Transaction.objects.create(
                            user=user,
                            transaction_type=transaction_type,
                            amount=amount_float,
                            source=source,
                            account=account,
                            description=email_body[:255],
                            category=None
                        )
                        saved_count += 1
                    else:
                        print(f"Skipping non-transactional email: {email_body[:80]}...")
            
            user.last_email_sync = datetime.datetime.now(datetime.timezone.utc)
            user.save()

            all_transactions = Transaction.objects.filter(user=user).order_by('-date')
            
            transactions_list = list(all_transactions.values(
                'transaction_type', 
                'amount', 
                'source', 
                'account', 
                'description', 
                'category', 
                'date'
            ))

            message = f"Sync complete. Scanned {scanned_count} email(s) and found {saved_count} new transaction(s)."
            return JsonResponse({
                'status': 'success', 
                'message': message,
                'transactions': transactions_list
            })

        except BasicInfo.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'User with that email not found.'}, status=404)
        
        except HttpError as error:
            print(f"Google API HttpError during manual sync for {email}: {error}")
            if error.resp.status == 401:
                return JsonResponse({'status': 'error', 'message': 'Google authentication failed. Please reconnect your Google account.'}, status=401)
            return JsonResponse({'status': 'error', 'message': f'A Google API error occurred: {error}'}, status=500)
        
        except Exception as e:
            print(f"Generic error during manual sync for {email}: {str(e)}")
            return JsonResponse({'status': 'error', 'message': f'An unexpected error occurred: {str(e)}'}, status=500)
    
    return JsonResponse({"error": "Only POST allowed"}, status=405)
