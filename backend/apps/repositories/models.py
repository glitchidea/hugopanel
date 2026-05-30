"""
Repository and AuditLog models.
"""
import uuid
from django.db import models
from django.conf import settings


class Repository(models.Model):
    PROVIDER_CHOICES = [
        ('github', 'GitHub'),
        ('gitlab', 'GitLab'),
        ('gitea', 'Gitea'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='repositories',
    )
    name = models.CharField(max_length=255, help_text='e.g. glitchidea/blog')
    display_name = models.CharField(max_length=255, help_text='Human-readable name')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='github')
    clone_url = models.URLField(max_length=512)
    access_token_encrypted = models.TextField(help_text='Encrypted access token (Fernet)')
    default_branch = models.CharField(max_length=128, default='main')
    content_path = models.CharField(
        max_length=512,
        default='content/',
        help_text='Hugo content directory path (relative to repo root)',
    )
    local_path = models.CharField(max_length=512, blank=True, help_text='Absolute path to local clone')
    last_synced = models.DateTimeField(null=True, blank=True)
    is_syncing = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'repositories'
        verbose_name = 'Repository'
        verbose_name_plural = 'Repositories'
        unique_together = [('owner', 'name')]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.display_name} ({self.name})'

    @property
    def is_cloned(self) -> bool:
        import os
        return bool(self.local_path) and os.path.isdir(self.local_path)


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('sync', 'Sync'),
        ('clone', 'Clone'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repo = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    file_path = models.CharField(max_length=512, blank=True)
    commit_sha = models.CharField(max_length=40, blank=True, null=True)
    commit_msg = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action} on {self.repo.name} by {self.user}'
