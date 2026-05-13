from rest_framework.response import Response
from rest_framework.decorators import api_view

from apps.core.models import Project
from apps.core.serializers import ProjectSerializer


@api_view(["GET"])
def hello(request):
    return Response({"message": "Hello from Django backend"})


@api_view(["GET", "POST"])
def projects(request):

    if request.method == "GET":
        queryset = Project.objects.all().order_by("-created_at")
        serializer = ProjectSerializer(queryset, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = ProjectSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)
