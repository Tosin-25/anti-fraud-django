from django.shortcuts import render

# Create your views here.
#handles the logic for the api endpoints
#they process incoming request and return 
#serializers

#import necessary modules
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserRegistrationSerializer, UserSerializer
from django.contrib.auth import authenticate #, login # login is for session auth
# For Token Authentication (built-in DRF)
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
# For JWT Authentication (if you choose Simple JWT)
# from rest_framework_simplejwt.tokens import RefreshToken
# from rest_framework_simplejwt.views import TokenObtainPairView
#from .models import User # Or: 
from django.contrib.auth import get_user_model; User = get_user_model()

#For userRegistrationView
#uses generic.CreateAPIView for simplicity with userregistrationserializer

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny] # Anyone can register

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Optionally, generate a token for the new user immediately
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": token.key,
            "message": "User registered successfully."
        }, status=status.HTTP_201_CREATED)
    

    #Create User login view
    #custom using django.contrib.auth.authenticate and drf token
class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Please provide both email and password'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Since USERNAME_FIELD is 'email', authenticate uses email
        user = authenticate(request, username=email, password=password) # 'username' here refers to USERNAME_FIELD

        if user is not None:
            # login(request, user) # For session-based auth, not typically primary for DRF APIs
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'email': user.email,
                'fullName': user.fullName,
                'message': 'Login successful.'
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid credentials'},
                            status=status.HTTP_401_UNAUTHORIZED)

#create userprofileview (for retrieving and updateing user profile)
#             
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated] # Only logged-in users can access

    def get_object(self):
        return self.request.user # Returns the currently authenticated user

