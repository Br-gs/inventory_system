from django.urls import path, include
from .user_api import RegisterView, UserDetailView, ChangePasswordView, LogoutView, UserListView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

app_name = 'accounts'

urlpatterns = [
    # API endpoints for JWT authentication
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # API endpoints for user registration and profile management
    path('register/', RegisterView.as_view(), name='register'),
    path('user/profile/', UserDetailView.as_view(), name='user_profile'),
    path('user/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('users/', UserListView.as_view(), name='user_list'),]