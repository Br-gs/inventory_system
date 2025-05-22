from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile

# Manages the additional fields of the user profile.
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('phone_number')

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)

    class Meta: 
        model = User
        fields = ('id', 'username', 'email', 'password', 'profile')
        read_only_fields = ('id',)

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
    )
    password2 = serializers.CharField(write_only=True, required=True)
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name', 'profile')

    # Validate that there is no other user with the same email address.
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists."})
        return attrs
    
    # Create the user and its associated profile.
    def create(self, validated_data):
        profile_data = validated_data.pop('profile', None)
        password2 = validated_data.pop('password2', None)

        user = User.objects.create_user(**validated_data)

        if profile_data:
            UserProfile.objects.filter(user=user).update(**profile_data)
        return user
    
# To allow users to change their passwords.   
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Passwords do not match."})
        return attrs