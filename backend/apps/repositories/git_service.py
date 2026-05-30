"""
Git service — wraps GitPython for clone, pull, push, tree operations.
"""
import os
import logging
import shutil
import time
from pathlib import Path
from typing import Optional

import git
from django.conf import settings

from apps.accounts.preferences import get_git_author_email, get_git_author_name
from .encryption import decrypt_token

logger = logging.getLogger(__name__)

REPOS_BASE = getattr(settings, 'GIT_REPOS_BASE_PATH', '/tmp/repos')


def _build_auth_url(clone_url: str, access_token: str) -> str:
    """Inject access token into HTTPS clone URL."""
    from urllib.parse import urlparse, urlunparse
    parsed = urlparse(clone_url)
    netloc = f'oauth2:{access_token}@{parsed.hostname}'
    if parsed.port:
        netloc += f':{parsed.port}'
    return urlunparse(parsed._replace(netloc=netloc))


def _get_actor(user):
    return git.Actor(get_git_author_name(user), get_git_author_email(user))


class GitService:
    def __init__(self, repository):
        """
        :param repository: apps.repositories.models.Repository instance
        """
        self.repo_model = repository
        self.local_path = repository.local_path or os.path.join(
            REPOS_BASE, str(repository.id)
        )

    def _get_plain_token(self) -> str:
        return decrypt_token(self.repo_model.access_token_encrypted)

    def _get_auth_url(self) -> str:
        return _build_auth_url(self.repo_model.clone_url, self._get_plain_token())

    def clone(self) -> str:
        """Clone repo. Returns local path."""
        os.makedirs(REPOS_BASE, exist_ok=True)
        if os.path.isdir(self.local_path):
            shutil.rmtree(self.local_path)

        auth_url = self._get_auth_url()
        logger.info(f'Cloning {self.repo_model.name} to {self.local_path}')

        git.Repo.clone_from(
            auth_url,
            self.local_path,
            branch=self.repo_model.default_branch,
        )
        return self.local_path

    def pull(self) -> None:
        """Pull latest changes from remote."""
        repo = git.Repo(self.local_path)
        origin = repo.remotes.origin
        # Re-set remote URL with fresh token
        origin.set_url(self._get_auth_url())
        origin.pull(self.repo_model.default_branch)
        logger.info(f'Pulled {self.repo_model.name}')

    def ensure_up_to_date(self) -> None:
        """Clone if not exists, pull if exists."""
        if not os.path.isdir(self.local_path):
            self.clone()
        else:
            self.pull()

    def get_file_tree(self, branch: Optional[str] = None) -> list[dict]:
        """Return file tree under content_path."""
        if not os.path.isdir(self.local_path):
            raise FileNotFoundError(f'Repo not cloned: {self.local_path}')

        content_dir = os.path.join(self.local_path, self.repo_model.content_path.lstrip('/'))
        if not os.path.isdir(content_dir):
            return []

        tree = []
        for root, dirs, files in os.walk(content_dir):
            # Skip hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for fname in sorted(files):
                if fname.endswith('.md'):
                    abs_path = os.path.join(root, fname)
                    rel_path = os.path.relpath(abs_path, self.local_path)
                    tree.append({
                        'path': rel_path.replace('\\', '/'),
                        'name': fname,
                        'size': os.path.getsize(abs_path),
                        'modified': os.path.getmtime(abs_path),
                    })
        return tree

    def read_file(self, file_path: str) -> str:
        """Read a file from the local clone. file_path is relative to repo root."""
        abs_path = os.path.join(self.local_path, file_path.lstrip('/'))
        with open(abs_path, 'r', encoding='utf-8') as f:
            return f.read()

    def write_and_commit(self, file_path: str, content: str, commit_message: str, branch: Optional[str] = None) -> str:
        """Write file, commit and push. Returns commit SHA."""
        repo = git.Repo(self.local_path)
        target_branch = branch or self.repo_model.default_branch

        # Checkout branch
        if repo.active_branch.name != target_branch:
            repo.git.checkout(target_branch)

        abs_path = os.path.join(self.local_path, file_path.lstrip('/'))
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)

        with open(abs_path, 'w', encoding='utf-8') as f:
            f.write(content)

        repo.index.add([abs_path])
        actor = _get_actor(self.repo_model.owner)
        commit = repo.index.commit(
            commit_message,
            author=actor,
            committer=actor,
        )

        # Push with auth URL
        origin = repo.remotes.origin
        origin.set_url(self._get_auth_url())
        origin.push(refspec=f'{target_branch}:{target_branch}')

        logger.info(f'Committed and pushed: {commit.hexsha[:8]} on {self.repo_model.name}')
        return commit.hexsha

    def delete_and_commit(self, file_path: str, commit_message: str, branch: Optional[str] = None) -> str:
        """Delete file, commit and push. Returns commit SHA."""
        repo = git.Repo(self.local_path)
        target_branch = branch or self.repo_model.default_branch

        if repo.active_branch.name != target_branch:
            repo.git.checkout(target_branch)

        abs_path = os.path.join(self.local_path, file_path.lstrip('/'))
        if not os.path.exists(abs_path):
            raise FileNotFoundError(f'File not found: {file_path}')

        os.remove(abs_path)
        repo.index.remove([abs_path])

        actor = _get_actor(self.repo_model.owner)
        commit = repo.index.commit(
            commit_message,
            author=actor,
            committer=actor,
        )

        origin = repo.remotes.origin
        origin.set_url(self._get_auth_url())
        origin.push(refspec=f'{target_branch}:{target_branch}')

        return commit.hexsha

    def get_branches(self) -> list[str]:
        """Return list of remote branches."""
        repo = git.Repo(self.local_path)
        origin = repo.remotes.origin
        origin.set_url(self._get_auth_url())
        origin.fetch()
        return [ref.remote_head for ref in origin.refs if ref.remote_head != 'HEAD']

    def test_connection(self) -> bool:
        """Test if clone URL + token are valid by doing a ls-remote."""
        try:
            auth_url = self._get_auth_url()
            git.cmd.Git().ls_remote(auth_url)
            return True
        except git.GitCommandError as e:
            logger.warning(f'Connection test failed: {e}')
            return False
