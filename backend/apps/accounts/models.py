"""
Custom User model with UUID primary key and email authentication.
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Settings
    default_commit_template = models.CharField(
        max_length=256,
        default='feat: {action} {file}',
        help_text='Commit message template. Use {action} and {file} placeholders.'
    )
    default_branch = models.CharField(max_length=128, default='main')
    default_content_path = models.CharField(
        max_length=512,
        default='content/',
        help_text='Default Hugo content directory for newly connected repositories.',
    )
    git_author_name = models.CharField(
        max_length=128,
        blank=True,
        default='',
        help_text='Git commit author name. Empty uses server default from environment.',
    )
    git_author_email = models.EmailField(
        blank=True,
        default='',
        help_text='Git commit author email. Empty uses server default from environment.',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = UserManager()

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f'{self.username} <{self.email}>'
