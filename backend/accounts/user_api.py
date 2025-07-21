from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from django.contrib.auth.models import User
from rest_framework.views import APIView
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
    MyTokenObtainPairSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
import logging
from rest_framework_simplejwt.views import TokenObtainPairView

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Generate tokens for the new user for automatic login
            refresh = RefreshToken.for_user(user)

            logger.info(f"New user registered: {user.username}")

            return Response(
                {
                    "message": "User registered successfully.",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                    },
                    "tokens": {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        logger.warning(f"Registration failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Allows authenticated users to view and update their information.
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    # queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    # returns the current user authenticated
    def get_object(self):
        return self.request.user

    # register when a user deletes their account
    def perform_destroy(self, instance):
        logger.info(
            f"User {instance.username} (ID: {instance.id}) deleted their account."
        )
        super().perform_destroy(instance)

    # register when a user updates their profile
    def perform_update(self, serializer):
        logger.info(
            f"User {self.request.user.username} (ID: {self.request.user.id}) updated their profile."
        )
        serializer.save()


class ChangePasswordView(GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        user = request.user
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            new_password = serializer.validated_data.get("new_password")
            user.set_password(new_password)
            user.save()
            logger.info(f"Password updated successfully for user {user.username}.")
            return Response(
                {"message": "Password updated successfully."},
                status=status.HTTP_200_OK,
            )
        logger.warning(
            f"Password change failed for user {user.username}: {serializer.errors}."
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# view to handle user logout and blacklist the refresh token
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                logger.warning(
                    f"Logout attempt by {request.user.username} without refresh token."
                )
                return Response(
                    {"error": "Refresh token is required "},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info(
                f"User {request.user.username} logged out and token blacklisted."
            )
            return Response(
                {"message": "Logged out successfully."},
                status=status.HTTP_205_RESET_CONTENT,
            )
        except TokenError as te:
            logger.error(
                f"TokenError during logout for user {request.user.username}: {str(te)}"
            )
            return Response(
                {"error": "Invalid or blacklisted refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.error(
                f"Exception during logout for {request.user.username}: {str(e)}"
            )
            return Response(
                {"error": "An unexpected error occurred during logout."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_queryset(self):
        return (
            User.objects.filter(is_active=True)
            .select_related("profile")
            .order_by("-date_joined")
        )


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
