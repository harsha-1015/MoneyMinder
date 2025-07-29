from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('api/create-profile/',views.register_user,name='register-user'),
    path('api/get-user',views.get_user,name='get-user-details'),
    path('google/connect/', views.connect_google, name='connect_google'),
    path('google/callback/', views.google_callback, name='google_callback'),
    # path('read-emails/', views.read_gmail_emails, name='read_emails'),
    path('api/manual-sync/',views.manual_sync,name='manual-email-sync'),
    path('api/get-analysis/', views.get_financial_analysis, name='get-analysis'),
    # path('api/create-profile/', views.create_profile, name='create-profile'),
]
