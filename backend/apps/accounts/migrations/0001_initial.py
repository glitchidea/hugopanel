# Generated manually for HugoPanel accounts.User

import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                (
                    'is_superuser',
                    models.BooleanField(
                        default=False,
                        help_text='Designates that this user has all permissions without explicitly assigning them.',
                        verbose_name='superuser status',
                    ),
                ),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('username', models.CharField(max_length=64, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=False)),
                (
                    'default_commit_template',
                    models.CharField(
                        default='feat: {action} {file}',
                        help_text='Commit message template. Use {action} and {file} placeholders.',
                        max_length=256,
                    ),
                ),
                ('default_branch', models.CharField(default='main', max_length=128)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'groups',
                    models.ManyToManyField(
                        blank=True,
                        help_text='The groups this user belongs to.',
                        related_name='user_set',
                        related_query_name='user',
                        to='auth.group',
                        verbose_name='groups',
                    ),
                ),
                (
                    'user_permissions',
                    models.ManyToManyField(
                        blank=True,
                        help_text='Specific permissions for this user.',
                        related_name='user_set',
                        related_query_name='user',
                        to='auth.permission',
                        verbose_name='user permissions',
                    ),
                ),
            ],
            options={
                'verbose_name': 'User',
                'verbose_name_plural': 'Users',
                'db_table': 'users',
            },
        ),
    ]
