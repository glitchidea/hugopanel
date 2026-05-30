from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RepositoryViewSet
from apps.posts.views import PostViewSet

router = DefaultRouter()
router.register(r'', RepositoryViewSet, basename='repository')

# Posts are nested under repos
posts_list = PostViewSet.as_view({'get': 'list', 'post': 'create'})
posts_detail = PostViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})

urlpatterns = [
    path('', include(router.urls)),
    # Nested posts routes
    path('<uuid:repo_pk>/posts/', posts_list, name='post-list'),
    path('<uuid:repo_pk>/posts/<path:file_path>/', posts_detail, name='post-detail'),
]
