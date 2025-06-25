from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone # For joinDate


# Create your models here.
class User(AbstractUser):
    # AbstractUser already has: username, first_name, last_name, password,
    # groups, user_permissions, is_staff, is_active, is_superuser, last_login, date_joined.

    # We override the email field to make it unique, as it's our USERNAME_FIELD.
    email = models.EmailField(('email address'), unique=True)
    fullName = models.CharField(max_length=255, blank=True, null=True)
    # joinDate is essentially what 'date_joined' (inherited from AbstractUser) provides.
    # If you need a distinct field, you can add:
    # joinDate = models.DateTimeField(default=timezone.now)

    # To make email the primary login identifier instead of username:
    USERNAME_FIELD = 'email'
    # 'username' is removed from REQUIRED_FIELDS as email is the username.
    # If you still need a username field for other purposes (and it's not the login identifier),
    # you might need to adjust AbstractUser's username field or add a new one.
    # For simplicity, if email is the identifier, 'username' from AbstractUser might become redundant
    # or you might choose to remove it entirely by creating a custom AbstractBaseUser.
    # However, AbstractUser requires 'username'. If you keep AbstractUser and USERNAME_FIELD = 'email',
    # you might still need 'username' in REQUIRED_FIELDS for createsuperuser unless you customize the manager.
    # A common approach is to make the original 'username' field also unique and possibly blank=True, null=True if not used.
    # For now, let's keep 'username' as required for 'createsuperuser' compatibility.
    REQUIRED_FIELDS = ['username', 'fullName']

    def __str__(self):
        return self.email