from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    # Read-only field to display username instead of user ID
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Transaction
        fields = ('id', 'user', 'user_username', 'type', 'amount', 'category', 'description', 'date', 'timestamp')
        read_only_fields = ('user', 'date', 'timestamp') # User is set by the view, not client