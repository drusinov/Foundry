from django.http import JsonResponse


def health(request):
    return JsonResponse({
        "status": "ok",
        "service": "backend"
    })


def hello(request):
    return JsonResponse({
        "message": "Hello from Django backend"
    })