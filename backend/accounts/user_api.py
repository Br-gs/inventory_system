from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from django.contrib.auth.models import User
from rest_framework.views import APIView
from .serializers import UserSerializer, RegisterSerializer, ChangePasswordSerializer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
import logging

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
            
            return Response({
                "message": "User registered successfully.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Allows authenticated users to view and update their information.
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    # returns the current user authenticated
    def get_object(self):
        return self.request.user
    
    # register when a user deletes their account
    def perform_destroy(self, instance):
        logger.info(f"User {instance.username} deleted their account.")
        super().perform_destroy(instance)

    # register when a user updates their profile
    def perform_update(self, serializer):
        logger.info(f"User {self.request.user.username} updated their profile.")
        super().perform_update(serializer)

class ChangePasswordView(GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
    
    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            old_password = serializer.validated_data.get("old_password")
            new_password = serializer.validated_data.get("new_password")
            if not user.check_password(old_password):
                return Response(
                    {"old_password": ["Old password is not correct."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.set_password(new_password)
            user.save()
            return Response(
                {"message": "Password updated successfully."},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# view to handle user logout and blacklist the refresh token
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required "}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info(f"User {request.user.username} logged out and token blacklisted.")
            return Response({"message": "Logged out successfully."}, status=status.HTTP_205_RESET_CONTENT)
        except TokenError as te:
            return Response({"error": str(te)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
class UserListView(generics.ListAPIView):
    queryset = User.objects.all().select_related('profile')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_queryset(self):
        return User.objects.filter(is_active=True).select_related('profile').order_by('-date_joined')