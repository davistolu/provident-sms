import uuid
from django.db import models

class BaseModel(models.Model):
    """Abstract base model with UUID primary key and timestamp tracking."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']

class TenantModel(BaseModel):
    """
    Abstract model enforcing multi-tenant school isolation.
    Every school-scoped entity inherits from this model.
    """
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_set',
        db_index=True
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']
