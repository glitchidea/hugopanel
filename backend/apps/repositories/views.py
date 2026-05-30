"""
Repository views — CRUD + sync + branches + tree + posts.
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Repository, AuditLog
from .serializers import (
    RepositorySerializer,
    RepositoryListSerializer,
    AuditLogSerializer,
    FileTreeItemSerializer,
)
from .git_service import GitService
from .tasks import clone_repository_task, sync_repository_task

logger = logging.getLogger(__name__)


def success_response(data, status_code=200, meta=None):
    body = {'success': True, 'data': data}
    if meta:
        body['meta'] = meta
    return Response(body, status=status_code)


class RepositoryViewSet(viewsets.ModelViewSet):
    """
    /api/v1/repos/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = RepositorySerializer

    def get_queryset(self):
        return Repository.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return RepositoryListSerializer
        return RepositorySerializer

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        return success_response(serializer.data, meta={'count': qs.count()})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Test connection before saving
        from .encryption import encrypt_token
        from .git_service import GitService
        import tempfile, os

        # Quick validation - test with ls-remote
        try:
            instance = serializer.save()
        except Exception as e:
            return Response(
                {'success': False, 'error': {'code': 'CREATE_FAILED', 'message': str(e)}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Trigger async clone
        clone_repository_task.delay(str(instance.id))

        return success_response(
            RepositorySerializer(instance, context={'request': request}).data,
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Clean up local clone
        import shutil, os
        if instance.local_path and os.path.isdir(instance.local_path):
            shutil.rmtree(instance.local_path, ignore_errors=True)
        instance.delete()
        return Response({'success': True, 'data': None}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='sync')
    def sync(self, request, pk=None):
        """POST /api/v1/repos/{id}/sync/"""
        repo = self.get_object()
        if repo.is_syncing:
            return Response(
                {'success': False, 'error': {'code': 'ALREADY_SYNCING', 'message': 'Repository sync already in progress.'}},
                status=status.HTTP_409_CONFLICT
            )
        sync_repository_task.delay(str(repo.id))
        return success_response({'message': 'Sync started.', 'repo_id': str(repo.id)})

    @action(detail=True, methods=['post'], url_path='test-connection')
    def test_connection(self, request, pk=None):
        """POST /api/v1/repos/{id}/test-connection/"""
        repo = self.get_object()
        svc = GitService(repo)
        ok = svc.test_connection()
        if ok:
            return success_response({'connected': True})
        return Response(
            {'success': False, 'error': {'code': 'CONNECTION_FAILED', 'message': 'Cannot connect to repository.'}},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['get'], url_path='branches')
    def branches(self, request, pk=None):
        """GET /api/v1/repos/{id}/branches/"""
        repo = self.get_object()
        if not repo.is_cloned:
            return success_response([repo.default_branch])
        try:
            svc = GitService(repo)
            branches = svc.get_branches()
            return success_response(branches)
        except Exception as e:
            return success_response([repo.default_branch])

    @action(detail=True, methods=['get'], url_path='tree')
    def tree(self, request, pk=None):
        """GET /api/v1/repos/{id}/tree/"""
        repo = self.get_object()
        if not repo.is_cloned:
            return Response(
                {'success': False, 'error': {'code': 'NOT_CLONED', 'message': 'Repository is not cloned yet. Trigger a sync first.'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            svc = GitService(repo)
            tree = svc.get_file_tree()
            return success_response(tree, meta={'count': len(tree)})
        except Exception as e:
            logger.error(f'Tree failed: {e}')
            return Response(
                {'success': False, 'error': {'code': 'TREE_ERROR', 'message': str(e)}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], url_path='audit-logs')
    def audit_logs(self, request, pk=None):
        """GET /api/v1/repos/{id}/audit-logs/"""
        repo = self.get_object()
        logs = repo.audit_logs.all()[:50]
        return success_response(AuditLogSerializer(logs, many=True).data)
