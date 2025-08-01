from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile
import logging
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

logger = logging.getLogger(__name__)


# Manages the additional fields of the user profile.
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ("phone_number",)


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "date_joined",
            "is_staff",
            "profile",
        )
        read_only_fields = (
            "id",
            "date_joined",
            "is_staff",
        )

    def update(self, instance, validated_data):

        profile_data = validated_data.pop("profile", None)

        # update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # update profile fields if they exist
        if profile_data:
            profile = instance.profile
            profile_serializer = UserProfileSerializer(
                profile, data=profile_data, partial=True
            )
            if profile_serializer.is_valid(raise_exception=True):
                profile_serializer.save()

        return instance


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
        label="Confirm Password",
    )
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = (
            "username",
            "password",
            "password2",
            "email",
            "first_name",
            "last_name",
            "profile",
        )
        extra_kwargs = {
            "first_name": {"required": False},
            "last_name": {"required": False},
        }

    # Validate that there is no other user with the same email address.
    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    # Validate that there is no other user with the same username.
    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with this username already exists."
            )
        return value

    # generals validates
    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    # Create the user and its associated profile.
    def create(self, validated_data):
        profile_data = validated_data.pop("profile", None)
        validated_data.pop("password2", None)

        user = User.objects.create_user(**validated_data)
        logger.info(f"User {user.username} created by RegisterSerializer.")

        if profile_data:
            try:
                profile = user.profile
                profile_serializer = UserProfileSerializer(
                    profile, data=profile_data, partial=True
                )
                if profile_serializer.is_valid(raise_exception=True):
                    profile_serializer.save()
                    logger.info(f"Profile data updated for new user {user.username}.")
                else:
                    logger.error(
                        f"Error validating profile data for new user {user.username}: {profile_serializer.errors}"
                    )
            except UserProfile.DoesNotExist:
                logger.error(
                    f"User profile does not exist for new user {user.username} after creation. signal might have failed."
                )
            except Exception as e:
                logger.error(
                    f"Error updating profile for new user {user.username}: {str(e)}"
                )
        return user


# To allow users to change their passwords.
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        required=True, style={"input_type": "password"}
    )
    new_password = serializers.CharField(
        required=True, validators=[validate_password], style={"input_type": "password"}
    )
    new_password2 = serializers.CharField(
        required=True, style={"input_type": "password"}, label="Confirm New Password"
    )

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError(
                {"new_password": "Passwords do not match."}
            )
        return attrs

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

class UserAdminSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    class Meta:
        model = User

        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'profile')
        read_only_fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile')

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # custom claims
        token["username"] = user.username
        token["email"] = user.email
        token["is_staff"] = user.is_staff
        return token

