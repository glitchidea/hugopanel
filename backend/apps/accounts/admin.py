from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'is_active', 'is_staff', 'created_at')
    list_filter = ('is_active', 'is_staff')
    search_fields = ('email', 'username')
    ordering = ('-created_at',)
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        (
            'Settings',
            {
                'fields': (
                    'default_commit_template',
                    'default_branch',
                    'default_content_path',
                    'git_author_name',
                    'git_author_email',
                ),
            },
        ),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'created_at')}),
    )
    readonly_fields = ('created_at',)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
    )
