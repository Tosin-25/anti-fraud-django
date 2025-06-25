from django.db import models
from users.models import User # Import your custom user model

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )

    # Link transaction to a user
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    description = models.TextField()
    date = models.DateField(auto_now_add=True) # Automatically set date on creation
    timestamp = models.DateTimeField(auto_now_add=True) # Automatically set timestamp on creation

    class Meta:
        ordering = ['-timestamp'] # Order by newest first

    def __str__(self):
        return f"{self.user.username} - {self.type.capitalize()} - ${self.amount}"