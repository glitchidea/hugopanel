"""
Post serializers — file-based (no DB model, git is the store).
"""
from rest_framework import serializers


class FrontMatterSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    date = serializers.CharField(required=False, default='')
    draft = serializers.BooleanField(default=False)
    description = serializers.CharField(required=False, default='', allow_blank=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    categories = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    author = serializers.CharField(required=False, default='', allow_blank=True)
    slug = serializers.CharField(required=False, default='', allow_blank=True)
    image = serializers.CharField(required=False, default='', allow_blank=True)
    weight = serializers.IntegerField(required=False, default=0)


class PostCreateSerializer(serializers.Serializer):
    file_path = serializers.CharField(
        max_length=512,
        help_text='Relative path within repo, e.g. content/blog/my-post.md'
    )
    front_matter = FrontMatterSerializer()
    content = serializers.CharField(allow_blank=True, default='')
    commit_message = serializers.CharField(min_length=3, max_length=256)
    branch = serializers.CharField(required=False, default='')

    def validate_file_path(self, value):
        import re
        if '..' in value:
            raise serializers.ValidationError("file_path cannot contain '..'")
        # Allow alphanumeric, hyphens, underscores, dots, forward slashes
        if not re.match(r'^[a-zA-Z0-9/_\-\.]+$', value):
            raise serializers.ValidationError("file_path contains invalid characters")
        if not value.endswith('.md'):
            raise serializers.ValidationError("file_path must end with '.md'")
        return value


class PostUpdateSerializer(serializers.Serializer):
    front_matter = FrontMatterSerializer()
    content = serializers.CharField(allow_blank=True, default='')
    commit_message = serializers.CharField(min_length=3, max_length=256)
    branch = serializers.CharField(required=False, default='')


class PostSummarySerializer(serializers.Serializer):
    """Used for list responses."""
    path = serializers.CharField()
    title = serializers.CharField()
    date = serializers.CharField()
    draft = serializers.BooleanField()
    tags = serializers.ListField(child=serializers.CharField())
    categories = serializers.ListField(child=serializers.CharField())
    description = serializers.CharField()
    section = serializers.CharField()
    author = serializers.CharField()
    slug = serializers.CharField()
    last_modified = serializers.FloatField()


class PostDetailSerializer(serializers.Serializer):
    """Used for detail/editor responses."""
    path = serializers.CharField()
    front_matter = FrontMatterSerializer()
    content = serializers.CharField()
    format = serializers.CharField()
    last_modified = serializers.FloatField()


class PostDeleteSerializer(serializers.Serializer):
    commit_message = serializers.CharField(min_length=3, max_length=256)
    branch = serializers.CharField(required=False, default='')
