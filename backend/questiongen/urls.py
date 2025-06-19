from django.urls import path
from .views import generate_questions

urlpatterns = [
    path('generate-questions', generate_questions),
]
