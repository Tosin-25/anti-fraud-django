from django.urls import path, include
from .views import TransactionListCreateView, TransactionDetailView

urlpatterns = [
    path('', TransactionListCreateView.as_view(), name='transaction-list-create'),
    path('<int:pk>/', TransactionDetailView.as_view(), name='transaction-detail'), ]

