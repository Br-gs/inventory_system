from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from .models import UserProfile
from rest_framework_simplejwt.tokens import RefreshToken 
from django.contrib.auth.password_validation import CommonPasswordValidator, MinimumLengthValidator 

USER_DATA = {
    'username': 'testuser',
    'email': 'test@example.com',
    'password': 'StrongPassword123!',
    'first_name': 'Test',
    'last_name': 'User'
}
USER_PROFILE_DATA = {
    'phone_number': '+12345678901'
}
ADMIN_USER_DATA = {
    'username': 'adminuser',
    'email': 'admin@example.com',
    'password': 'StrongAdminPassword123!',
}

class AccountRegistrationAPITest(APITestCase):
    # test cases for user registration endpoints
    def setUp(self):
        self.register_url = reverse('accounts:register')

    def test_register_user_success(self):
        # test successful user registration
        data = {**USER_DATA, 'password2': USER_DATA['password']}
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(UserProfile.objects.count(), 1)
        user = User.objects.get(username=USER_DATA['username'])
        self.assertTrue(hasattr(user, 'profile'))
        self.assertEqual(response.data['user']['username'], USER_DATA['username'])

    def test_register_user_with_profile_success(self):
        # test successful user registration with profile data
        data = {
            **USER_DATA,
            'password2': USER_DATA['password'],
            'profile': USER_PROFILE_DATA
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(User.objects.count(), 1)
        user = User.objects.get(username=USER_DATA['username'])
        self.assertIsNotNone(user.profile)
        self.assertEqual(user.profile.phone_number, USER_PROFILE_DATA['phone_number'])

    def test_register_user_existing_username(self):
        # test registration with an existing username
        User.objects.create_user(username=USER_DATA['username'], password='password')
        data = {**USER_DATA, 'password2': USER_DATA['password']}
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn('username', response.data)

    def test_register_user_existing_email(self):
        # test registration with an existing email
        User.objects.create_user(username='anotheruser', email=USER_DATA['email'], password='password')
        data = {**USER_DATA, 'password2': USER_DATA['password']}
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn('email', response.data)

    def test_register_user_password_mismatch(self):
        # test registration with password mismatch
        data = {**USER_DATA, 'password2': 'DifferentPassword123!'}
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn('password', response.data) # the error should indicate password mismatch

    def test_register_user_weak_password(self):
        # test registration with a weak password
        data = {**USER_DATA, 'password': 'short', 'password2': 'short'}
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn('password', response.data) # Django validate_password should give a weak password error


class AuthTokenAPITest(APITestCase):
    # test cases for obtaining, refreshing, and verifying authentication tokens
    def setUp(self):
        self.user = User.objects.create_user(username=USER_DATA['username'], password=USER_DATA['password'])
        self.token_obtain_url = reverse('accounts:token_obtain_pair')
        self.token_refresh_url = reverse('accounts:token_refresh')
        self.token_verify_url = reverse('accounts:token_verify')


    def test_obtain_token_success(self):
        # test obtaining tokens with valid credentials
        data = {'username': USER_DATA['username'], 'password': USER_DATA['password']}
        response = self.client.post(self.token_obtain_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_obtain_token_invalid_credentials(self):
        # test obtaining tokens with invalid credentials
        data = {'username': USER_DATA['username'], 'password': 'wrongpassword'}
        response = self.client.post(self.token_obtain_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, response.data)

    def test_refresh_token_success(self):
        # test refreshing a valid refresh token

        # first, obtain a refresh token and access token
        login_data = {'username': USER_DATA['username'], 'password': USER_DATA['password']}
        login_response = self.client.post(self.token_obtain_url, login_data, format='json')
        refresh_token = login_response.data['refresh']

        # then use the refresh token to get a new access token
        refresh_data = {'refresh': refresh_token}
        response = self.client.post(self.token_refresh_url, refresh_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIn('access', response.data)
        self.assertNotIn('refresh', response.data) # refresh token should not be returned on refresh

    def test_refresh_token_invalid(self):
        # test refreshing an invalid refresh token
        refresh_data = {'refresh': 'invalidtoken'}
        response = self.client.post(self.token_refresh_url, refresh_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, response.data) 

    def test_verify_token_success(self):
        # test verifying a valid access token
        login_data = {'username': USER_DATA['username'], 'password': USER_DATA['password']}
        login_response = self.client.post(self.token_obtain_url, login_data, format='json')
        access_token = login_response.data['access']

        verify_data = {'token': access_token}
        response = self.client.post(self.token_verify_url, verify_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

    def test_verify_token_invalid(self):
        # test verifying an invalid access token
        verify_data = {'token': 'invalidtoken'}
        response = self.client.post(self.token_verify_url, verify_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, response.data)


class UserProfileManagementAPITest(APITestCase):
    #test cases for user profile management, including retrieving, updating, changing password, and logout
    def setUp(self):
        self.user = User.objects.create_user(
            username=USER_DATA['username'],
            password=USER_DATA['password'],
            first_name=USER_DATA['first_name'],
            email=USER_DATA['email']
        )
        # the profile is created automatically when the user is created
        self.user.profile.phone_number = USER_PROFILE_DATA['phone_number']
        self.user.profile.save()

        self.profile_url = reverse('accounts:user_profile')
        self.change_password_url = reverse('accounts:change_password')
        self.logout_url = reverse('accounts:logout')

        # authenticate the user for the tests
        self.client.force_authenticate(user=self.user)
        # obtain a refresh token for logout tests
        login_response = self.client.post(reverse('accounts:token_obtain_pair'), {'username': USER_DATA['username'], 'password': USER_DATA['password']})
        self.refresh_token_for_logout = login_response.data.get('refresh')


    def test_retrieve_user_profile_success(self):
        # test retrieving the profile of the authenticated user
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['username'], self.user.username)
        self.assertEqual(response.data['email'], self.user.email)
        self.assertIn('profile', response.data)
        self.assertEqual(response.data['profile']['phone_number'], USER_PROFILE_DATA['phone_number'])

    def test_update_user_profile_success(self):
        # test updating the profile of the authenticated user
        update_data = {
            'first_name': 'UpdatedFirst',
            'last_name': 'UpdatedLast',
            'email': 'updated@example.com',
            'profile': {
                'phone_number': '+9876543210'
            }
        }
        response = self.client.patch(self.profile_url, update_data, format='json') # use PATCH for partial updates
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.user.refresh_from_db()
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.first_name, update_data['first_name'])
        self.assertEqual(self.user.email, update_data['email'])
        self.assertEqual(self.user.profile.phone_number, update_data['profile']['phone_number'])

    def test_update_user_profile_unauthenticated(self):
        # test updating the profile without authentication
        self.client.logout() # or self.client.force_authenticate(user=None)
        update_data = {'first_name': 'FailUpdate'}
        response = self.client.patch(self.profile_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, response.data)

    def test_change_password_success(self):
        # test changing the password of the authenticated user
        change_data = {
            'old_password': USER_DATA['password'],
            'new_password': 'NewStrongPassword123!',
            'new_password2': 'NewStrongPassword123!'
        }
        response = self.client.patch(self.change_password_url, change_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(change_data['new_password']))

    def test_change_password_wrong_old_password(self):
        # test changing password with an incorrect old password
        change_data = {
            'old_password': 'wrongoldpassword',
            'new_password': 'NewStrongPassword123!',
            'new_password2': 'NewStrongPassword123!'
        }
        response = self.client.patch(self.change_password_url, change_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn('old_password', response.data) # Or a general error message

    def test_change_password_new_passwords_mismatch(self):
        # test changing password with new passwords that do not match
        change_data = {
            'old_password': USER_DATA['password'],
            'new_password': 'NewStrongPassword123!',
            'new_password2': 'DifferentNewPassword123!'
        }
        response = self.client.patch(self.change_password_url, change_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn('new_password', response.data) # Or a general error message

    def test_logout_success(self):
        # test successful logout using the refresh token
        # secure that we have a refresh token
        self.assertIsNotNone(self.refresh_token_for_logout)
        logout_data = {'refresh': self.refresh_token_for_logout}
        response = self.client.post(self.logout_url, logout_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT, response.data)
        
        #try to refresh the token after logout, which should fail
        # This is to ensure the refresh token is invalidated after logout
        response_after_logout = self.client.post(reverse('accounts:token_refresh'), logout_data, format='json')
        self.assertEqual(response_after_logout.status_code, status.HTTP_401_UNAUTHORIZED, response_after_logout.data)

    def test_logout_no_refresh_token(self):
        # test logout without providing a refresh token
        response = self.client.post(self.logout_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)

    def test_delete_user_account_success(self):
        # test user authenticated deletion of their own account
        user_id_to_delete = self.user.id
        response = self.client.delete(self.profile_url) 
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT, response.data)
        self.assertFalse(User.objects.filter(id=user_id_to_delete).exists())


class UserListAPITest(APITestCase):
    # test cases for listing users, ensuring only admins can access the list
    def setUp(self):
        self.admin_user_for_list = User.objects.create_user(
            username=ADMIN_USER_DATA['username'], # 'list_admin_user'
            email=ADMIN_USER_DATA['email'],       # 'list_admin@example.com'
            password=ADMIN_USER_DATA['password'],
            is_staff=True,
            is_active=True
        )
        self.regular_user_for_list = User.objects.create_user(
            username='list_regular_user', 
            email='list_regular@example.com',
            password=USER_DATA['password'],
            is_active=True
        )
        self.active_user2_for_list = User.objects.create_user(
            username='list_active2_user', 
            email='list_active2@example.com',
            password='password123',
            is_active=True
        )
        self.inactive_user_for_list = User.objects.create_user(
            username='list_inactive_user', 
            email='list_inactive@example.com',
            password='password123',
            is_active=False
        )
        self.user_list_url = reverse('accounts:user_list')


    def test_list_users_admin_success(self):
        # test that an admin can list users
        self.client.force_authenticate(user=self.admin_user_for_list)
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        
        # verify that the response contains the expected structure
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
        
        results = response.data['results']
        # waiting 3 activate users (admin_user_for_list, regular_user_for_list, active_user2_for_list)
        self.assertEqual(len(results), 3, f"Expected 3 users in results, got {len(results)}. Data: {response.data}")
        self.assertEqual(response.data['count'], 3, f"Expected count of 3, got {response.data['count']}. Data: {response.data}")

        usernames_in_response = sorted([u['username'] for u in results]) # sort to ensure order is consistent
        expected_usernames = sorted([
            self.admin_user_for_list.username,
            self.regular_user_for_list.username,
            self.active_user2_for_list.username
        ])
        
        self.assertEqual(usernames_in_response, expected_usernames)
        # Aditionally, ensure the inactive user is not in the list
        for user_data in results:
            self.assertNotEqual(user_data['username'], self.inactive_user_for_list.username)


    def test_list_users_regular_user_forbidden(self):
        # test that a regular user cannot list users
        self.client.force_authenticate(user=self.regular_user_for_list)
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_list_users_unauthenticated_forbidden(self):
        # test that an unauthenticated user cannot list users
        response = self.client.get(self.user_list_url)
        # if Autenticated is the first permission class, it should return 401
        # If AllowAny were first and then IsAdminUser, it could be 403 if the anonymous user is not staff.
        # With the current configuration (IsAuthenticated, IsAdminUser), it should be 401.
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, response.data)


