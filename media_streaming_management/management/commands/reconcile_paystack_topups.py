from decimal import Decimal

import requests

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import F

from media_streaming_management.models import CreditAccount, CreditTopUp

# Adjust imports to your actual apps


class Command(BaseCommand):
    help = "Reconcile pending Paystack credit top-ups"

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Actually credit verified payments"
        )

        parser.add_argument(
            "--reference",
            type=str,
            help="Reconcile one transaction reference"
        )

    def handle(self, *args, **options):
        apply_changes = options["apply"]
        reference = options["reference"]

        queryset = CreditTopUp.objects.filter(
            status="pending",
            payment_method="paystack"
        )

        if reference:
            queryset = queryset.filter(reference=reference)

        if not queryset.exists():
            self.stdout.write("No matching pending top-ups.")
            return

        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"
        }

        for topup in queryset:
            try:
                response = requests.get(
                    (
                        f"{settings.PAYSTACK_BASE_URL}"
                        f"/transaction/verify/{topup.reference}"
                    ),
                    headers=headers,
                    timeout=30
                )
                response.raise_for_status()

                verification = response.json()
                payment = verification.get("data") or {}

                expected_amount = int(
                    Decimal(str(topup.amount_rands)) * 100
                )

                verified = (
                    verification.get("status") is True
                    and payment.get("status") == "success"
                    and payment.get("reference") == topup.reference
                    and payment.get("amount") == expected_amount
                    and payment.get("currency") == "ZAR"
                )

                if not verified:
                    self.stdout.write(
                        f"Reference: {topup.reference}\n"
                        f"Paystack status: {payment.get('status')}\n"
                        f"Reference matches: {payment.get('reference') == topup.reference}\n"
                        f"Expected cents: {expected_amount}\n"
                        f"Received cents: {payment.get('amount')}\n"
                        f"Currency: {payment.get('currency')}"
                    )

                if not verified:
                    self.stdout.write(
                        self.style.WARNING(
                            f"SKIPPED: {topup.reference} "
                            "(verification or payment details mismatch)"
                        )
                    )
                    continue

                if not apply_changes:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"VERIFIED: {topup.reference} "
                            f"| User {topup.user_id} "
                            f"| Credits {topup.credits_added} "
                            "| DRY RUN"
                        )
                    )
                    continue

                with transaction.atomic():
                    locked_topup = (
                        CreditTopUp.objects
                        .select_for_update()
                        .get(pk=topup.pk)
                    )

                    if locked_topup.status != "pending":
                        self.stdout.write(
                            f"SKIPPED: {topup.reference} "
                            "(already processed or status changed)"
                        )
                        continue

                    account, _ = CreditAccount.objects.get_or_create(
                        user=locked_topup.user
                    )

                    CreditAccount.objects.filter(
                        pk=account.pk
                    ).update(
                        balance=F("balance") + locked_topup.credits_added
                    )

                    locked_topup.status = "success"
                    locked_topup.save(update_fields=["status"])

                self.stdout.write(
                    self.style.SUCCESS(
                        f"RECONCILED: {topup.reference}"
                    )
                )

            except (requests.RequestException, ValueError) as exc:
                self.stderr.write(
                    f"ERROR: {topup.reference}: {exc}"
                )