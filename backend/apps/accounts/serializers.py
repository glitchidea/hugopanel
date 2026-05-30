"""
Accounts serializers — Register, Login, Profile
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm password')

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'username',
            'default_commit_template',
            'default_branch',
            'default_content_path',
            'git_author_name',
            'git_author_email',
            'created_at',
        )
        read_only_fields = ('id', 'email', 'created_at')

    def validate_default_content_path(self, value):
        value = value.strip()
        if '..' in value:
            raise serializers.ValidationError('Path cannot contain "..".')
        if not value.endswith('/'):
            value = f'{value}/'
        return value

    def validate_git_author_email(self, value):
        return (value or '').strip()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match.'})
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Add user info to JWT token response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserProfileSerializer(self.user).data
        return data
