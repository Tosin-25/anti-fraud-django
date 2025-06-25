from django.shortcuts import render

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Transaction
from .serializers import TransactionSerializer


class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]  # Only authenticated users can access

    def get_queryset(self):
        """
        Optionally restricts the returned transactions to a given user,
        by filtering against a `user` query parameter in the URL.
        For admin, you might allow a 'user_id' filter.
        For regular users, they only see their own transactions.
        """
        queryset = Transaction.objects.all()

        # If the user is an admin, allow filtering by 'user_id'
        if self.request.user.is_staff:  # is_staff is a Django built-in for admin users
            user_id = self.request.query_params.get('user_id')
            if user_id:
                queryset = queryset.filter(user__id=user_id)
        else:  # For regular users, only show their own transactions
            queryset = queryset.filter(user=self.request.user)

        # Implement type filtering
        transaction_type = self.request.query_params.get('type')
        if transaction_type:
            queryset = queryset.filter(type=transaction_type)

        return queryset.order_by('-timestamp')  # Order by newest first

    def perform_create(self, serializer):
        # Set the user of the transaction to the currently authenticated user
        serializer.save(user=self.request.user)


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    #def get_queryset(self):
     #   """
      #  Ensure a user can only retrieve, update, or delete their own transactions.
#"""