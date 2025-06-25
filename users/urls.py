
#Import necessary modules:

from django.urls import path
from django.http import JsonResponse
from .views import UserRegistrationView, UserLoginView, UserProfileView # , CustomAuthTokenLoginView
# If using DRF's ObtainAuthToken directly or SimpleJWT's views:
# from rest_framework.authtoken.views import obtain_auth_token
# from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('', lambda request: JsonResponse({"message": "Welcome to the Users API, KING 👑"})),
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', UserLoginView.as_view(), name='user-login'), # If using your custom UserLoginView
    # path('login/', CustomAuthTokenLoginView.as_view(), name='user-login-token'), # If using subclassed ObtainAuthToken
    # path('api-token-auth/', obtain_auth_token, name='api_token_auth'), # If using DRF's default ObtainAuthToken
    # For Simple JWT:
    # path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
]