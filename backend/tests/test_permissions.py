import pytest
from apps.finance.models import FeeCategory

@pytest.mark.django_db
class TestPermissions:
    def test_teacher_cannot_access_finance(self, api_client, school_a, teacher_a):
        FeeCategory.objects.create(school=school_a, name="Tuition")

        api_client.force_authenticate(user=teacher_a)
        api_client.credentials(HTTP_X_SCHOOL_ID=str(school_a.id))

        # Teacher attempts to access finance fee-categories -> 403 Forbidden
        res = api_client.get('/api/v1/finance/fee-categories/')
        assert res.status_code == 403

        # Teacher attempts to access finance invoices -> 403 Forbidden
        res_inv = api_client.get('/api/v1/finance/invoices/')
        assert res_inv.status_code == 403

    def test_unauthenticated_request_denied(self, api_client):
        res = api_client.get('/api/v1/students/students/')
        assert res.status_code == 401
