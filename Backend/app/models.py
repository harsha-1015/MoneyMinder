from django.db import models
from django.utils import timezone

# User Profile Model
class BasicInfo(models.Model):
    # This will be the unique ID provided by Firebase Authentication
    # --- FIX: Added null=True and blank=True to allow existing rows to be migrated ---
    firebase_uid = models.CharField(max_length=128, unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    occupation = models.CharField(max_length=100)
    salary = models.IntegerField()
    marital_status = models.CharField(max_length=20)
    gender = models.CharField(max_length=10)
    # The password field is now removed
    
    last_email_sync = models.DateTimeField(null=True, blank=True)
    google_access_token = models.TextField(null=True, blank=True)
    google_refresh_token = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.email


# Transaction Model
class Transaction(models.Model):
    user = models.ForeignKey(BasicInfo, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10)
    amount = models.FloatField()
    source = models.CharField(max_length=100)
    account = models.CharField(max_length=50, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    category = models.CharField(max_length=50, null=True, blank=True)
    date = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.user.full_name}: {self.transaction_type} ₹{self.amount} - {self.source}"

#monthly reports of the financial analysis
class FinancialReport(models.Model):
    user = models.ForeignKey(BasicInfo, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    report_data = models.JSONField()
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'month', 'year')

    def __str__(self):
        return f"Report for {self.user.email} - {self.month}/{self.year}"