"""
Celery tasks for async repository operations.
"""
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def clone_repository_task(self, repo_id: str):
    """Async clone a repository."""
    from apps.repositories.models import Repository
    from apps.repositories.git_service import GitService

    try:
        repo = Repository.objects.get(id=repo_id)
        repo.is_syncing = True
        repo.save(update_fields=['is_syncing'])

        svc = GitService(repo)
        local_path = svc.clone()

        repo.local_path = local_path
        repo.is_syncing = False
        repo.last_synced = timezone.now()
        repo.save(update_fields=['local_path', 'is_syncing', 'last_synced'])

        logger.info(f'Cloned repo {repo.name} to {local_path}')
        return {'status': 'ok', 'local_path': local_path}

    except Repository.DoesNotExist:
        logger.error(f'Repository {repo_id} not found')
        return {'status': 'error', 'message': 'Repository not found'}
    except Exception as exc:
        logger.error(f'Clone failed for {repo_id}: {exc}')
        try:
            repo = Repository.objects.get(id=repo_id)
            repo.is_syncing = False
            repo.save(update_fields=['is_syncing'])
        except Exception:
            pass
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def sync_repository_task(self, repo_id: str):
    """Async pull latest changes from remote."""
    from apps.repositories.models import Repository, AuditLog
    from apps.repositories.git_service import GitService

    try:
        repo = Repository.objects.get(id=repo_id)
        repo.is_syncing = True
        repo.save(update_fields=['is_syncing'])

        svc = GitService(repo)
        svc.ensure_up_to_date()

        repo.is_syncing = False
        repo.last_synced = timezone.now()
        repo.save(update_fields=['is_syncing', 'last_synced'])

        AuditLog.objects.create(
            repo=repo,
            user=None,
            action='sync',
            commit_msg='Automated sync (pull)',
        )

        logger.info(f'Synced repo {repo.name}')
        return {'status': 'ok'}

    except Repository.DoesNotExist:
        return {'status': 'error', 'message': 'Repository not found'}
    except Exception as exc:
        logger.error(f'Sync failed for {repo_id}: {exc}')
        try:
            repo = Repository.objects.get(id=repo_id)
            repo.is_syncing = False
            repo.save(update_fields=['is_syncing'])
        except Exception:
            pass
        raise self.retry(exc=exc)
