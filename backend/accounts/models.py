from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
import logging
from location.models import Location

logger = logging.getLogger(__name__)


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("admin", "Administrator"),
        ("manager", "Manager"),
        ("employee", "Employee"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    phone_regex = RegexValidator(
        regex=r"^\+?1?\d{9,15}$",
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.",
    )
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        null=True,
        help_text="Phone number must be in international format",
    )

    # Role of the user in the system
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="employee",
        help_text="User role in the system",
    )

    default_location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="default_users",
        help_text="Default location for this user's operations",
    )

    can_change_location = models.BooleanField(
        default=False, help_text="Whether user can override their default location"
    )

    allowed_locations = models.ManyToManyField(
        Location,
        blank=True,
        related_name="allowed_users",
        help_text="Locations this user is allowed to operate in",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        db_table = "accounts_user_profile"

    def __str__(self):
        return f"{self.user.username}'s profile"

    def clean(self):
        """Validate that non-admin users have a default location assigned"""
        super().clean()
        # Only validate if user exists (not during signal creation)
        if hasattr(self, 'user'):
            # Non-admin users must have a default location
            if not self.user.is_staff and not self.default_location:
                raise ValidationError({
                    'default_location': 'A default location is required for non-admin users.'
                })

    def save(self, *args, **kwargs):
        """Override save to ensure validation"""
        # Skip validation during signal creation (when profile is being created automatically)
        if not self._state.adding:
            self.full_clean()
        super().save(*args, **kwargs)

    def get_full_name(self):
        if self.user.first_name and self.user.last_name:
            return f"{self.user.first_name} {self.user.last_name}".strip()
        return self.user.username

    def get_accessible_locations(self):
        """Get all locations this user can access"""
        
        if self.user.is_staff:
            # Admins can access all locations
            return Location.objects.filter(is_active=True)
        elif self.allowed_locations.exists():
            # User has specific allowed locations
            return self.allowed_locations.filter(is_active=True)
        elif self.default_location:
            # User can only access their default location
            return Location.objects.filter(
                id=self.default_location.id, is_active=True
            )
        else:
            # No access to any location
            return Location.objects.none()

    def can_access_location(self, location):
        """Check if user can access a specific location"""
        return location in self.get_accessible_locations()


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        try:
            role = "admin" if instance.is_staff else "employee"
            
            profile, profile_created = UserProfile.objects.get_or_create(
                user=instance, 
                defaults={"role": role}
            )
            
            if (not instance.is_staff and profile_created and 
                not profile.default_location):
                # asynchronously assign a default location if none is set
                import time
                time.sleep(0.1)
                
                # Refresh profile from DB to ensure it's up-to-date
                profile.refresh_from_db()
                
                if not profile.default_location:
                    first_location = Location.objects.filter(is_active=True).first()
                    if first_location:
                        profile.default_location = first_location
                        profile.save(update_fields=['default_location'])
                        logger.info(f"Auto-assigned location {first_location.name} to user {instance.username}")
            
            logger.info(f"User profile created for {instance.username}")
        except Exception as e:
            logger.error(f"Error creating user profile for {instance.username}: {str(e)}")
    else:
        try:
            if hasattr(instance, "profile"):
                # Update role if staff status changed
                if instance.is_staff and instance.profile.role != "admin":
                    instance.profile.role = "admin"
                    instance.profile.save()
                elif not instance.is_staff and instance.profile.role == "admin":
                    instance.profile.role = "employee"
                    instance.profile.save()

                logger.info(
                    f"User profile updated for {instance.username} during user update"
                )
            else:
                role = "admin" if instance.is_staff else "employee"
                UserProfile.objects.create(user=instance, role=role)
                logger.warning(
                    f"User profile not found for existing user {instance.username}, creating a new one"
                )
        except Exception as e:
            logger.error(
                f"Error saving user profile for {instance.username} during user update: {str(e)}"
            )