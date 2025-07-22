from django.db import models
from django.utils import timezone

# User Profile Model
class BasicInfo(models.Model):
    full_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    gender = models.CharField(max_length=100)
    occupation = models.CharField(max_length=100)
    salary = models.PositiveIntegerField()
    marital_status = models.CharField(max_length=50, default='single')
    password = models.CharField(max_length=100, default='Temp@1234')
    created_at = models.DateTimeField(auto_now_add=True)
    google_access_token = models.TextField(null=True, blank=True)
    google_refresh_token = models.TextField(null=True, blank=True)
    last_email_sync = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.full_name


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
