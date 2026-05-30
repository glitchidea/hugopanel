from django.contrib import admin
from .models import Repository, AuditLog


@admin.register(Repository)
class RepositoryAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'name', 'provider', 'owner', 'is_syncing', 'last_synced')
    list_filter = ('provider', 'is_syncing')
    search_fields = ('name', 'display_name', 'owner__email')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'repo', 'user', 'file_path', 'commit_sha', 'created_at')
    list_filter = ('action',)
    search_fields = ('repo__name', 'commit_msg')
    readonly_fields = ('id', 'created_at')
