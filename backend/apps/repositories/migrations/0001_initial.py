import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Repository',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(help_text='e.g. glitchidea/blog', max_length=255)),
                ('display_name', models.CharField(help_text='Human-readable name', max_length=255)),
                ('provider', models.CharField(choices=[('github', 'GitHub'), ('gitlab', 'GitLab'), ('gitea', 'Gitea')], default='github', max_length=20)),
                ('clone_url', models.URLField(max_length=512)),
                ('access_token_encrypted', models.TextField(help_text='Encrypted access token (Fernet)')),
                ('default_branch', models.CharField(default='main', max_length=128)),
                ('content_path', models.CharField(default='content/', help_text='Hugo content directory path (relative to repo root)', max_length=512)),
                ('local_path', models.CharField(blank=True, help_text='Absolute path to local clone', max_length=512)),
                ('last_synced', models.DateTimeField(blank=True, null=True)),
                ('is_syncing', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'owner',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='repositories',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'verbose_name': 'Repository',
                'verbose_name_plural': 'Repositories',
                'db_table': 'repositories',
                'ordering': ['-created_at'],
                'unique_together': {('owner', 'name')},
            },
        ),
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action', models.CharField(choices=[('create', 'Create'), ('update', 'Update'), ('delete', 'Delete'), ('sync', 'Sync'), ('clone', 'Clone')], max_length=20)),
                ('file_path', models.CharField(blank=True, max_length=512)),
                ('commit_sha', models.CharField(blank=True, max_length=40, null=True)),
                ('commit_msg', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'repo',
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='audit_logs', to='repositories.repository'),
                ),
                (
                    'user',
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={
                'verbose_name': 'Audit Log',
                'verbose_name_plural': 'Audit Logs',
                'db_table': 'audit_logs',
                'ordering': ['-created_at'],
            },
        ),
    ]
