from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('api/email-otp',views.get_email,name='email-otp'),
    path('api/basic-info',views.get_basicInfo,name='basic-info'),
    path('api/check-email',views.check_email_exists,name='check-email'),
    path('api/login-verification',views.send_LoginVerfication,name='login-verification'),
    path('api/get-user-details',views.get_user_details,name='get-user-details'),
    path('google/connect/', views.connect_google, name='connect_google'),
    path('google/callback/', views.google_callback, name='google_callback'),
    path('read-emails/', views.read_gmail_emails, name='read_emails'),
    path('api/manual-sync/',views.manual_sync_view,name='manual-email-sync'),
    path('api/get-analysis/', views.get_financial_analysis, name='get-analysis'),
    path('api/create-profile/', views.create_profile, name='create-profile'),
]