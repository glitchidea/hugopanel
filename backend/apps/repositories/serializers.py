"""
Repository serializers.
"""
from rest_framework import serializers
from .models import Repository, AuditLog
from .encryption import encrypt_token, decrypt_token


class RepositorySerializer(serializers.ModelSerializer):
    access_token = serializers.CharField(write_only=True, required=True, min_length=20)
    post_count = serializers.SerializerMethodField(read_only=True)
    is_cloned = serializers.BooleanField(read_only=True)

    class Meta:
        model = Repository
        fields = (
            'id', 'name', 'display_name', 'provider', 'clone_url',
            'access_token', 'default_branch', 'content_path',
            'local_path', 'last_synced', 'is_syncing', 'is_cloned',
            'post_count', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'local_path', 'last_synced', 'is_syncing', 'created_at', 'updated_at')

    def get_post_count(self, obj):
        """Count .md files in local clone."""
        try:
            from apps.repositories.git_service import GitService
            svc = GitService(obj)
            return len(svc.get_file_tree())
        except Exception:
            return 0

    def validate_content_path(self, value):
        if not value.endswith('/'):
            raise serializers.ValidationError("content_path must end with '/'")
        if '..' in value:
            raise serializers.ValidationError("content_path cannot contain '..'")
        return value

    def create(self, validated_data):
        plain_token = validated_data.pop('access_token')
        validated_data['access_token_encrypted'] = encrypt_token(plain_token)
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'access_token' in validated_data:
            plain_token = validated_data.pop('access_token')
            validated_data['access_token_encrypted'] = encrypt_token(plain_token)
        return super().update(instance, validated_data)


class RepositoryListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views."""
    is_cloned = serializers.BooleanField(read_only=True)

    class Meta:
        model = Repository
        fields = (
            'id', 'name', 'display_name', 'provider',
            'default_branch', 'last_synced', 'is_syncing', 'is_cloned', 'created_at',
        )


class AuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = ('id', 'action', 'file_path', 'commit_sha', 'commit_msg', 'user_username', 'created_at')


class FileTreeItemSerializer(serializers.Serializer):
    path = serializers.CharField()
    name = serializers.CharField()
    size = serializers.IntegerField()
    modified = serializers.FloatField()


class BranchSerializer(serializers.Serializer):
    name = serializers.CharField()
