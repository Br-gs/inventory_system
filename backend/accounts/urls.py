from django.urls import path
from .user_api import (
    RegisterView,
    UserDetailView,
    ChangePasswordView,
    LogoutView,
    UserListView,
    MyTokenObtainPairView,
    MyTokenRefreshView,
    UserAdminDetailView,
    UserAccessibleLocationsView,
)
from rest_framework_simplejwt.views import TokenVerifyView

app_name = "accounts"

urlpatterns = [
    # API endpoints for JWT authentication
    path("token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", MyTokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("logout/", LogoutView.as_view(), name="logout"),
    # API endpoints for user registration and profile management
    path("register/", RegisterView.as_view(), name="register"),
    path("user/profile/", UserDetailView.as_view(), name="user_profile"),
    path("user/change-password/", ChangePasswordView.as_view(), name="change_password"),
    path(
        "user/accessible-locations/",
        UserAccessibleLocationsView.as_view(),
        name="user_accessible_locations",
    ),
    # Admin user management
    path("users/", UserListView.as_view(), name="user_list"),
    path("users/<int:pk>/", UserAdminDetailView.as_view(), name="user_admin_detail"),
]
