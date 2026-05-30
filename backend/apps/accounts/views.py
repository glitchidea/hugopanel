"""
Auth views — Register, Login (JWT), Refresh, Logout, Profile
"""
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
)


def success_response(data, status_code=200, meta=None):
    body = {'success': True, 'data': data}
    if meta:
        body['meta'] = meta
    return Response(body, status=status_code)


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/"""
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return success_response(
            UserProfileSerializer(user).data,
            status_code=status.HTTP_201_CREATED
        )


class LoginView(TokenObtainPairView):
    """POST /api/v1/auth/login/"""
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(serializer.validated_data)


class LogoutView(APIView):
    """POST /api/v1/auth/logout/ — Blacklist refresh token"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return success_response({'message': 'Logged out successfully.'})
        except Exception:
            return success_response({'message': 'Logged out.'})


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/auth/me/"""
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(serializer.data)


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'success': False, 'error': {'code': 'INVALID_PASSWORD', 'message': 'Current password is incorrect.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return success_response({'message': 'Password changed successfully.'})


class DeleteAccountView(APIView):
    """DELETE /api/v1/auth/me/"""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
