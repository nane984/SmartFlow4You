from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import SupplierRegistrationRequest, User, CandidateRegistrationPending


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "is_staff")
    list_filter = ("role", "is_staff", "is_superuser", "is_active")

    fieldsets = UserAdmin.fieldsets + (
        ("Role", {"fields": ("role", "company")}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Role", {"fields": ("role",)}),
    )


@admin.register(CandidateRegistrationPending)
class CandidateRegistrationPendingAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "created_at", "expires_at", "confirmed_at")
    list_filter = ("confirmed_at",)
    search_fields = ("username", "email", "token")
    readonly_fields = ("token", "password", "created_at", "confirmed_at", "created_user")


@admin.register(SupplierRegistrationRequest)
class SupplierRegistrationRequestAdmin(admin.ModelAdmin):
    list_display = ("username", "company_name", "email", "status", "submitted_at")
    list_filter = ("status",)
    search_fields = ("username", "email", "company_name")
    readonly_fields = ("submitted_at", "reviewed_at", "reviewed_by", "created_user", "password")
