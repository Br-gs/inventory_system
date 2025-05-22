from rest_framework import generics, status, permissions
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.views import APIView
from .serializers import UserSerializer, RegisterSerializer, ChangePasswordSerializer
from django.contrib.auth import get_user_model

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully."},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Allows authenticated users to view and update their information.
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class changePasswordView(APIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            if not user.check_password(serializer.data.get("old_password")):
                return Response(
                    {"old_password": ["Old password is not correct."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response(
                {"message": "Password updated successfully."},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)