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

#models import
from .models import BasicInfo,Transaction

#views
@csrf_exempt
def get_email(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        otp = random.randint(100000, 999999)

        subject = "Money-Minder OTP for login"
        message = f"Your OTP forMoney-minder is: {otp}\nDo not share it with anyone."
        from_email = "gharshavardhanreddy115@gmail.com"

        try:
            send_mail(subject, message, from_email, [email])
            return JsonResponse({"status": "sent", "otp": otp})
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)})

    return JsonResponse({"status": "error", "message": "POST only"})
        
@csrf_exempt
def check_email_exists(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        if BasicInfo.objects.filter(email=email).exists():
            return JsonResponse({'exists': True})
        else:
            return JsonResponse({'exists': False})


@csrf_exempt
def send_LoginVerfication(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return JsonResponse({'status': 'error', 'message': 'Email and password are required'}, status=400)

            user = BasicInfo.objects.get(email=email, password=password)
            return JsonResponse({'status': 'success', 'message': 'Login successful'})

        except BasicInfo.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Invalid email or password'}, status=401)

        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)

    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)

@csrf_exempt
def get_basicInfo(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        try:
            BasicInfo.objects.create(
                full_name=data.get('full_name'),
                email=data.get('email'),  
                occupation=data.get('occupation'),
                salary=int(data.get('salary')),
                marital_status=data.get('marital_status'),
                gender=data.get('gender'),
                password=data.get('password'),
            )
            return JsonResponse({"status": "success"})
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)})
    return JsonResponse({"error": "Only POST allowed"})

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
        query = f"after:{financial_year_start} (invoice OR bank OR receipt OR credited OR debited)"

        results = service.users().messages().list(userId='me', q=query, maxResults=10).execute()
        messages = results.get('messages', [])

        saved = 0
        emails = []

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

            source_match = re.search(r'(?:by|from)\s([A-Za-z0-9 &@.-]+)', snippet)
            source = source_match.group(1).strip() if source_match else 'Unknown'

            account_match = re.search(r'A/c\s*([Xx*#\d]+)', snippet)
            account = account_match.group(1) if account_match else 'Not found'

            # Convert ₹5,000.00 → 5000.00
            amount_float = float(amount.replace('₹', '').replace(',', '')) if amount else 0

            # Save to DB
            Transaction.objects.create(
                user=user,
                transaction_type=transaction_type,
                amount=amount_float,
                source=source,
                account=account,
                description=snippet,
                category=None  # Optionally predicted later
            )

            saved += 1
            emails.append({
                'from': sender,
                'subject': subject,
                'snippet': snippet,
                'transaction_type': transaction_type,
                'amount': amount,
                'source': source,
                'account': account
            })

        return JsonResponse({
            'saved': saved,
            'emails': emails
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


