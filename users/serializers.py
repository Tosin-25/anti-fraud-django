#import necessary modules
from rest_framework import serializers
from .models import User # Or: from django.contrib.auth import get_user_model; User = get_user_model()


#define UserSerializer for general user data(read-only or profile updates )
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'fullName', 'date_joined'] # Or 'joinDate' if you added it
        read_only_fields = ['id', 'date_joined'] # Fields that should not be changed via this serializer directly


#Define UserRegistrationSerializers for creating new users (signup)
#this serializer will handle password correctly

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm password', style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'fullName', 'password', 'password2']
        extra_kwargs = {
            'fullName': {'required': True}
        }

    def validate_email(self, value):
        # The model's unique=True on email field already handles this at DB level,
        # but early validation is good practice.
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email address is already in use.")
        return value

    def validate_username(self, value):
        # AbstractUser's username is unique by default.
        if User.objects.filter(username=value).exists():
             raise serializers.ValidationError("This username is already taken.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        # Removed the User.objects.filter checks for email and username from here
        # as they are better handled in validate_email and validate_username or by model validation.
        return attrs

    def create(self, validated_data):
        # Remove password2 before creating user
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            fullName=validated_data['fullName'],
            password=validated_data['password'] # create_user handles password hashing
        )
        # user.set_password(validated_data['password']) # create_user already handles this.
        # user.save() # create_user also saves.
        return user
