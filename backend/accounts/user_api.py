from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework.decorators import action
from django.contrib.auth.models import User
from rest_framework.views import APIView
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
    MyTokenObtainPairSerializer,
    UserAdminSerializer,
    UserCreateSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
import logging
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

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


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_destroy(self, instance):
        logger.info(
            f"User {instance.username} (ID: {instance.id}) deleted their account."
        )
        super().perform_destroy(instance)

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


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            refresh_token = response.data.pop("refresh", None)
            if refresh_token:
                response.set_cookie(
                    key="refresh_token",
                    value=refresh_token,
                    httponly=True,
                    samesite="Lax",
                    secure=False,
                    path="/token/refresh/",
                )
            return response


class MyTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"error": "Refresh token not found in the cookies."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        request.data["refresh"] = refresh_token

        try:
            response = super().post(request, *args, **kwargs)
            return response
        except TokenError as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token_value = request.COOKIES.get("refresh_token")
            if not refresh_token_value:
                logger.warning(
                    f"Logout attempt by {request.user.username} without refresh token."
                )
                return Response(
                    {"error": "Refresh token not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = RefreshToken(refresh_token_value)
            token.blacklist()
            response = Response(
                {"message": "Logged out successfully."},
                status=status.HTTP_205_RESET_CONTENT,
            )
            response.delete_cookie("refresh_token")
            logger.info(
                f"User {request.user.username} logged out and token blacklisted."
            )
            return response
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


class UserListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        return (
            User.objects.filter(is_active=True)
            .select_related("profile", "profile__default_location")
            .prefetch_related("profile__allowed_locations")
            .order_by("-date_joined")
        )

    def create(self, request, *args, **kwargs):
        """Create a new user (admin only)"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            logger.info(
                f"New user created by admin {request.user.username}: {user.username}"
            )

            # Return the created user with full details
            response_serializer = UserSerializer(user)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.select_related(
        "profile", "profile__default_location"
    ).prefetch_related("profile__allowed_locations")
    serializer_class = UserAdminSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_update(self, serializer):
        user = serializer.save()
        logger.info(
            f"User {user.username} updated by admin {self.request.user.username}"
        )

    def perform_destroy(self, instance):
        logger.info(
            f"User {instance.username} deleted by admin {self.request.user.username}"
        )
        super().perform_destroy(instance)


# View to get accessible locations for the current user
class UserAccessibleLocationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get locations accessible to the current user"""
        user = request.user

        if not hasattr(user, "profile"):
            return Response(
                {"error": "User profile not found"}, status=status.HTTP_404_NOT_FOUND
            )

        accessible_locations = user.profile.get_accessible_locations()
        locations_data = [
            {
                "id": location.id,
                "name": location.name,
                "address": location.address,
                "is_default": location.id
                == (
                    user.profile.default_location.id
                    if user.profile.default_location
                    else None
                ),
            }
            for location in accessible_locations
        ]

        return Response(
            {
                "locations": locations_data,
                "can_change_location": user.profile.can_change_location,
                "default_location_id": (
                    user.profile.default_location.id
                    if user.profile.default_location
                    else None
                ),
            }
        )
