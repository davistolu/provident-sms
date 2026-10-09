from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.finance.views import (
    FeeCategoryViewSet, FeeStructureViewSet, StudentInvoiceViewSet,
    PaymentViewSet, ExpenseViewSet
)

router = DefaultRouter()
router.register('fee-categories', FeeCategoryViewSet, basename='fee-category')
router.register('fee-structures', FeeStructureViewSet, basename='fee-structure')
router.register('invoices', StudentInvoiceViewSet, basename='student-invoice')
router.register('payments', PaymentViewSet, basename='payment')
router.register('expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
]
