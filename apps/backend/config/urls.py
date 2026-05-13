from django.contrib import admin
from django.urls import path, include

from rest_framework.routers import DefaultRouter

from apps.core.views import (
    hello,
    projects,
    AgentViewSet,
    TaskViewSet,
)


router = DefaultRouter()
router.register(r"agents", AgentViewSet)
router.register(r"tasks", TaskViewSet)


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/hello/", hello),
    path("api/projects/", projects),

    path("api/", include(router.urls)),
]
