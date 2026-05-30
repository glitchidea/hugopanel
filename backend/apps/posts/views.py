"""
Post views — CRUD via git (no database model).
"""
import logging
import os
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.repositories.models import Repository, AuditLog
from apps.repositories.git_service import GitService
from .hugo_parser import parse_post, build_post
from .serializers import (
    PostCreateSerializer,
    PostUpdateSerializer,
    PostDeleteSerializer,
    PostSummarySerializer,
    PostDetailSerializer,
)

logger = logging.getLogger(__name__)


def success_response(data, status_code=200, meta=None):
    body = {'success': True, 'data': data}
    if meta:
        body['meta'] = meta
    return Response(body, status=status_code)


def get_repo_or_404(repo_pk, user):
    try:
        return Repository.objects.get(id=repo_pk, owner=user)
    except Repository.DoesNotExist:
        return None


class PostViewSet(viewsets.ViewSet):
    """
    Nested under /api/v1/repos/{repo_pk}/posts/
    """
    permission_classes = [IsAuthenticated]

    def list(self, request, repo_pk=None):
        """GET /api/v1/repos/{id}/posts/"""
        repo = get_repo_or_404(repo_pk, request.user)
        if not repo:
            return Response(
                {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Repository not found.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        if not repo.is_cloned:
            return Response(
                {'success': False, 'error': {'code': 'NOT_CLONED', 'message': 'Repository is not cloned yet.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        svc = GitService(repo)
        tree = svc.get_file_tree()

        posts = []
        search = request.query_params.get('search', '').lower()
        status_filter = request.query_params.get('status', '')
        section_filter = request.query_params.get('section', '')
        sort_by = request.query_params.get('sort', 'date')

        for item in tree:
            try:
                raw = svc.read_file(item['path'])
                parsed = parse_post(raw)
                fm = parsed['front_matter']

                # Determine section (first dir under content_path)
                rel = item['path'].replace(repo.content_path.lstrip('/'), '', 1)
                section = rel.split('/')[0] if '/' in rel else ''

                post_data = {
                    'path': item['path'],
                    'title': fm.get('title', item['name']),
                    'date': str(fm.get('date', '')),
                    'draft': bool(fm.get('draft', False)),
                    'tags': fm.get('tags', []),
                    'categories': fm.get('categories', []),
                    'description': fm.get('description', ''),
                    'section': section,
                    'author': fm.get('author', ''),
                    'slug': fm.get('slug', ''),
                    'last_modified': item['modified'],
                }

                # Apply filters
                if search and search not in post_data['title'].lower():
                    continue
                if status_filter == 'draft' and not post_data['draft']:
                    continue
                if status_filter == 'published' and post_data['draft']:
                    continue
                if section_filter and post_data['section'] != section_filter:
                    continue

                posts.append(post_data)
            except Exception as e:
                logger.warning(f'Failed to parse {item["path"]}: {e}')

        # Sort
        if sort_by == 'title':
            posts.sort(key=lambda x: x['title'].lower())
        elif sort_by == 'modified':
            posts.sort(key=lambda x: x['last_modified'], reverse=True)
        else:
            posts.sort(key=lambda x: x['date'], reverse=True)

        # Paginate
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        paginated = posts[start:end]

        return success_response(
            paginated,
            meta={
                'count': len(posts),
                'page': page,
                'page_size': page_size,
                'total_pages': (len(posts) + page_size - 1) // page_size,
            }
        )

    def retrieve(self, request, repo_pk=None, file_path=None):
        """GET /api/v1/repos/{id}/posts/{file_path}/"""
        repo = get_repo_or_404(repo_pk, request.user)
        if not repo:
            return Response(
                {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Repository not found.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        svc = GitService(repo)
        try:
            raw = svc.read_file(file_path)
            parsed = parse_post(raw)
            result = {
                'path': file_path,
                'front_matter': parsed['front_matter'],
                'content': parsed['content'],
                'format': parsed['format'],
                'last_modified': os.path.getmtime(
                    os.path.join(repo.local_path, file_path.lstrip('/'))
                ),
            }
            return success_response(result)
        except FileNotFoundError:
            return Response(
                {'success': False, 'error': {'code': 'FILE_NOT_FOUND', 'message': f'File not found: {file_path}'}},
                status=status.HTTP_404_NOT_FOUND
            )

    def create(self, request, repo_pk=None):
        """POST /api/v1/repos/{id}/posts/"""
        repo = get_repo_or_404(repo_pk, request.user)
        if not repo:
            return Response(
                {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Repository not found.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = PostCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        svc = GitService(repo)
        try:
            # Ensure repo is up to date
            svc.ensure_up_to_date()

            fm = data['front_matter']
            content_str = build_post(dict(fm), data['content'])
            branch = data.get('branch') or repo.default_branch

            commit_sha = svc.write_and_commit(
                file_path=data['file_path'],
                content=content_str,
                commit_message=data['commit_message'],
                branch=branch,
            )

            AuditLog.objects.create(
                repo=repo,
                user=request.user,
                action='create',
                file_path=data['file_path'],
                commit_sha=commit_sha,
                commit_msg=data['commit_message'],
            )

            return success_response(
                {'path': data['file_path'], 'commit_sha': commit_sha},
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f'Post create failed: {e}')
            return Response(
                {'success': False, 'error': {'code': 'CREATE_FAILED', 'message': str(e)}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, repo_pk=None, file_path=None):
        """PUT /api/v1/repos/{id}/posts/{file_path}/"""
        repo = get_repo_or_404(repo_pk, request.user)
        if not repo:
            return Response(
                {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Repository not found.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = PostUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        svc = GitService(repo)
        try:
            # Read existing to preserve format
            try:
                raw = svc.read_file(file_path)
                existing = parse_post(raw)
                fmt = existing['format']
            except FileNotFoundError:
                fmt = 'yaml'

            fm = data['front_matter']
            content_str = build_post(dict(fm), data['content'], fmt)
            branch = data.get('branch') or repo.default_branch

            commit_sha = svc.write_and_commit(
                file_path=file_path,
                content=content_str,
                commit_message=data['commit_message'],
                branch=branch,
            )

            AuditLog.objects.create(
                repo=repo,
                user=request.user,
                action='update',
                file_path=file_path,
                commit_sha=commit_sha,
                commit_msg=data['commit_message'],
            )

            return success_response({'path': file_path, 'commit_sha': commit_sha})
        except Exception as e:
            logger.error(f'Post update failed: {e}')
            return Response(
                {'success': False, 'error': {'code': 'UPDATE_FAILED', 'message': str(e)}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, repo_pk=None, file_path=None):
        """DELETE /api/v1/repos/{id}/posts/{file_path}/"""
        repo = get_repo_or_404(repo_pk, request.user)
        if not repo:
            return Response(
                {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Repository not found.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        # Accept commit_message from query params or body
        commit_message = request.data.get('commit_message') or request.query_params.get('commit_message')
        if not commit_message:
            commit_message = f'chore: delete {file_path}'

        branch = request.data.get('branch') or repo.default_branch
        svc = GitService(repo)
        try:
            commit_sha = svc.delete_and_commit(
                file_path=file_path,
                commit_message=commit_message,
                branch=branch,
            )

            AuditLog.objects.create(
                repo=repo,
                user=request.user,
                action='delete',
                file_path=file_path,
                commit_sha=commit_sha,
                commit_msg=commit_message,
            )

            return success_response({'path': file_path, 'commit_sha': commit_sha})
        except FileNotFoundError:
            return Response(
                {'success': False, 'error': {'code': 'FILE_NOT_FOUND', 'message': f'File not found: {file_path}'}},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f'Post delete failed: {e}')
            return Response(
                {'success': False, 'error': {'code': 'DELETE_FAILED', 'message': str(e)}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
