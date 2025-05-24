from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import RegexValidator
import logging

logger = logging.getLogger(__name__)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        null=True,
        help_text="Phone number must be in internatinal format",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  
    
    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        db_table = 'accounts_user_profile'  

    def __str__(self):
        return f"{self.user.username}'s profile"
        
    def get_full_name(self):
        if self.user.first_name and self.user.last_name:
            return f"{self.user.first_name} {self.user.last_name}".strip()
        return self.user.username

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        try:
            UserProfile.objects.get_or_create(user=instance)
            logger.info(f"User profile created for {instance.username}")
        except Exception as e:
            logger.error(f"Error creating user profile for {instance.username}: {str(e)}")
    else:
        try:
            if hasattr(instance, 'profile'):
                instance.profile.save()
                logger.info(f"User profile updated for {instance.username} during user update")
            else:
                UserProfile.objects.create(user=instance)
                logger.warning(f"User profile not found for existing user {instance.username}, creating a new one")
        except Exception as e:
            logger.error(f"Error saving user profile for {instance.username} during user update: {str(e)}")
