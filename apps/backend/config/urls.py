from django.contrib import admin
from django.urls import path

from apps.core.views import hello, projects

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/hello/", hello),
    path("api/projects/", projects),
]
