# Defer DAT (SilverDAT3) integration to post-v1

**Status:** accepted (2026-08-05)

For v1 we ship the calculation/valuation flow as **fully manual** and do **not** integrate DAT SilverDAT3. The DAT modal in the app was never functional (a UI shell with zero API calls), wiring real SilverDAT3 needs external credentials and integration work we won't finish before launch, and shipping it advertised-but-broken would drive refunds.

## Consequences
- Remove DAT from the landing page, the onboarding/signup wizard, and stop collecting DAT credentials (currently stored in plaintext and never used — see `PRE_DELIVERY_AUDIT.md` B3 / H8). This removal is a v1 remediation task.
- Vehicle data continues to come from the existing NHTSA + AI VIN-decode path (audit M16); relabel any "DAT" wording in the UI accordingly.
- Revisit DAT as a post-v1 feature once credentials and API access exist.
