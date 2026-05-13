from django.contrib import admin
from django.urls import path

from apps.core.views import health, hello

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/hello/", hello),
]