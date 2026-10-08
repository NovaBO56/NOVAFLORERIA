# Inventario del esquema remoto

Captura: 2026-10-07T17:05:52.455684-04:00. Solo metadatos; las cifras de filas están en data-counts.json, sin registros personales. Este inventario no es un dump restaurable.

| Schema | Propietario | ACL | Tablas/vistas |
| --- | --- | --- | --- |
| realtime | supabase_admin | {supabase_admin=UC/supabase_admin,postgres=U*/supabase_admin,anon=U/supabase_admin,service_role=U/supabase_admin,supabase_realtime_admin=UC/supabase_admin,authenticated=U/supabase_admin} | 3 |
| extensions | postgres | {postgres=UC/postgres,anon=U/postgres,authenticated=U/postgres,service_role=U/postgres,dashboard_user=UC/postgres} | 2 |
| vault | supabase_admin | {supabase_admin=UC/supabase_admin,postgres=U*/supabase_admin,service_role=U/supabase_admin} | 2 |
| graphql_public | supabase_admin | {supabase_admin=UC/supabase_admin,postgres=U*/supabase_admin,anon=U/supabase_admin,authenticated=U/supabase_admin,service_role=U/supabase_admin} | 0 |
| graphql | supabase_admin | {supabase_admin=UC/supabase_admin,postgres=U*/supabase_admin,anon=U/supabase_admin,authenticated=U/supabase_admin,service_role=U/supabase_admin} | 0 |
| auth | supabase_admin | {supabase_admin=UC/supabase_admin,anon=U/supabase_admin,authenticated=U/supabase_admin,service_role=U/supabase_admin,supabase_auth_admin=UC/supabase_admin,dashboard_user=UC/supabase_admin,postgres=U/supabase_admin} | 27 |
| storage | supabase_admin | {supabase_admin=UC/supabase_admin,postgres=U*/supabase_admin,anon=U/supabase_admin,authenticated=U/supabase_admin,service_role=U/supabase_admin,supabase_storage_admin=U*C*/supabase_admin,dashboard_user=UC/supabase_admin} | 8 |
| supabase_migrations | postgres | — | 1 |
| public | pg_database_owner | {pg_database_owner=UC/pg_database_owner,=U/pg_database_owner,postgres=U/pg_database_owner,anon=U/pg_database_owner,authenticated=U/pg_database_owner,service_role=U/pg_database_owner} | 36 |

## Extensiones

| Extensión | Versión | Schema |
| --- | --- | --- |
| plpgsql | 1.0 | pg_catalog |
| pg_stat_statements | 1.11 | extensions |
| uuid-ossp | 1.1 | extensions |
| pgcrypto | 1.3 | extensions |
| supabase_vault | 0.3.1 | vault |

## Tipos y enums

No hay enums de negocio en public; los estados/roles se modelan como text más CHECK.

| Schema | Nombre | Tipo | Base | Default |
| --- | --- | --- | --- | --- |
| auth | factor_type | e | - | — |
| auth | factor_status | e | - | — |
| auth | aal_level | e | - | — |
| auth | code_challenge_method | e | - | — |
| auth | one_time_token_type | e | - | — |
| auth | oauth_registration_type | e | - | — |
| auth | oauth_authorization_status | e | - | — |
| auth | oauth_response_type | e | - | — |
| auth | oauth_client_type | e | - | — |
| storage | buckettype | e | - | — |
| realtime | action | e | - | — |
| realtime | equality_op | e | - | — |

### Etiquetas de enums

| Schema | Enum | Etiqueta | Orden |
| --- | --- | --- | --- |
| auth | factor_type | recovery_code | 4 |
| auth | factor_type | phone | 3 |
| auth | factor_type | webauthn | 2 |
| auth | factor_type | totp | 1 |
| auth | factor_status | verified | 2 |
| auth | factor_status | unverified | 1 |
| auth | aal_level | aal3 | 3 |
| auth | aal_level | aal2 | 2 |
| auth | aal_level | aal1 | 1 |
| auth | code_challenge_method | plain | 2 |
| auth | code_challenge_method | s256 | 1 |
| auth | one_time_token_type | phone_change_token | 6 |
| auth | one_time_token_type | email_change_token_current | 5 |
| auth | one_time_token_type | email_change_token_new | 4 |
| auth | one_time_token_type | recovery_token | 3 |
| auth | one_time_token_type | reauthentication_token | 2 |
| auth | one_time_token_type | confirmation_token | 1 |
| auth | oauth_registration_type | manual | 2 |
| auth | oauth_registration_type | dynamic | 1 |
| auth | oauth_authorization_status | expired | 4 |
| auth | oauth_authorization_status | denied | 3 |
| auth | oauth_authorization_status | approved | 2 |
| auth | oauth_authorization_status | pending | 1 |
| auth | oauth_response_type | code | 1 |
| auth | oauth_client_type | confidential | 2 |
| auth | oauth_client_type | public | 1 |
| storage | buckettype | VECTOR | 3 |
| storage | buckettype | ANALYTICS | 2 |
| storage | buckettype | STANDARD | 1 |
| realtime | action | ERROR | 5 |
| realtime | action | TRUNCATE | 4 |
| realtime | action | DELETE | 3 |
| realtime | action | UPDATE | 2 |
| realtime | action | INSERT | 1 |
| realtime | equality_op | isdistinct | 13 |
| realtime | equality_op | imatch | 12 |
| realtime | equality_op | match | 11 |
| realtime | equality_op | is | 10 |
| realtime | equality_op | ilike | 9 |
| realtime | equality_op | like | 8 |
| realtime | equality_op | in | 7 |
| realtime | equality_op | gte | 6 |
| realtime | equality_op | gt | 5 |
| realtime | equality_op | lte | 4 |
| realtime | equality_op | lt | 3 |
| realtime | equality_op | neq | 2 |
| realtime | equality_op | eq | 1 |

## Tablas y vistas por schema

| Objeto | Tipo | Propietario | RLS | FORCE RLS | ACL | Origen/alteraciones locales probables |
| --- | --- | --- | --- | --- | --- | --- |
| extensions.pg_stat_statements_info | v | postgres | No | No | {postgres=a*r*w*d*D*x*t*m*/postgres,=r/postgres,dashboard_user=arwdDxtm/postgres} | Plataforma Supabase; fuera del historial de aplicación |
| extensions.pg_stat_statements | v | postgres | No | No | {postgres=a*r*w*d*D*x*t*m*/postgres,=r/postgres,dashboard_user=arwdDxtm/postgres} | Plataforma Supabase; fuera del historial de aplicación |
| auth.saml_relay_states | r | supabase_auth_admin | Sí | No | {postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.flow_state | r | supabase_auth_admin | Sí | No | {postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.saml_providers | r | supabase_auth_admin | Sí | No | {postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.instances | r | supabase_auth_admin | Sí | No | {supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin,postgres=ar*wdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.schema_migrations | r | supabase_auth_admin | Sí | No | {supabase_auth_admin=arwdDxtm/supabase_auth_admin,postgres=r*/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.refresh_tokens | r | supabase_auth_admin | Sí | No | {supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin,postgres=ar*wdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| vault.secrets | r | supabase_admin | No | No | {supabase_admin=arwdDxtm/supabase_admin,postgres=r*d*D*x*/supabase_admin,service_role=rd/supabase_admin} | Plataforma Supabase; fuera del historial de aplicación |
| vault.decrypted_secrets | v | supabase_admin | No | No | {supabase_admin=arwdDxtm/supabase_admin,postgres=r*d*D*x*/supabase_admin,service_role=rd/supabase_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.users | r | supabase_auth_admin | Sí | No | {supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin,postgres=ar*wdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.audit_log_entries | r | supabase_auth_admin | Sí | No | {supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin,postgres=ar*wdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.sso_domains | r | supabase_auth_admin | Sí | No | {postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.mfa_amr_claims | r | supabase_auth_admin | Sí | No | {postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.identities | r | supabase_auth_admin | Sí | No | {postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.sessions | r | supabase_auth_admin | Sí | No | {postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.mfa_challenges | r | supabase_auth_admin | Sí | No | {postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.sso_providers | r | supabase_auth_admin | Sí | No | {postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.mfa_factors | r | supabase_auth_admin | Sí | No | {postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.one_time_tokens | r | supabase_auth_admin | Sí | No | {postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.oauth_consents | r | supabase_auth_admin | No | No | {postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.oauth_authorizations | r | supabase_auth_admin | No | No | {postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.oauth_client_states | r | supabase_auth_admin | No | No | {postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.oauth_clients | r | supabase_auth_admin | No | No | {postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| storage.buckets_analytics | r | supabase_storage_admin | Sí | No | {supabase_storage_admin=arwdDxtm/supabase_storage_admin,service_role=arwdDxtm/supabase_storage_admin,authenticated=arwdDxtm/supabase_storage_admin,anon=arwdDxtm/supabase_storage_admin} | 003_correccion_storage_product_images_empleado.sql → 012_fase6_pagos_qr_tablas.sql |
| auth.custom_oauth_providers | r | supabase_auth_admin | No | No | {postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.webauthn_credentials | r | supabase_auth_admin | No | No | {postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.webauthn_challenges | r | supabase_auth_admin | No | No | {postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| storage.migrations | r | supabase_storage_admin | Sí | No | — | 003_correccion_storage_product_images_empleado.sql → 012_fase6_pagos_qr_tablas.sql |
| storage.objects | r | supabase_storage_admin | Sí | No | {supabase_storage_admin=a*r*w*d*D*x*t*m*/supabase_storage_admin,service_role=arwdDxtm/supabase_storage_admin,authenticated=arwdDxtm/supabase_storage_admin,anon=arwdDxtm/supabase_storage_admin,postgres=a*r*w*d*D*x*t*m*/supabase_storage_admin} | 003_correccion_storage_product_images_empleado.sql → 012_fase6_pagos_qr_tablas.sql |
| realtime.messages | p | supabase_realtime_admin | Sí | No | {supabase_realtime_admin=arwdDxtm/supabase_realtime_admin,postgres=a*r*wdDxtm/supabase_realtime_admin,dashboard_user=arwdDxtm/supabase_realtime_admin,anon=arw/supabase_realtime_admin,authenticated=arw/supabase_realtime_admin,service_role=arw/supabase_realtime_admin} | Plataforma Supabase; fuera del historial de aplicación |
| storage.buckets | r | supabase_storage_admin | Sí | No | {supabase_storage_admin=a*r*w*d*D*x*t*m*/supabase_storage_admin,service_role=arwdDxtm/supabase_storage_admin,authenticated=arwdDxtm/supabase_storage_admin,anon=arwdDxtm/supabase_storage_admin,postgres=a*r*w*d*D*x*t*m*/supabase_storage_admin} | 003_correccion_storage_product_images_empleado.sql → 012_fase6_pagos_qr_tablas.sql |
| storage.s3_multipart_uploads | r | supabase_storage_admin | Sí | No | {supabase_storage_admin=arwdDxtm/supabase_storage_admin,service_role=arwdDxtm/supabase_storage_admin,authenticated=r/supabase_storage_admin,anon=r/supabase_storage_admin} | 003_correccion_storage_product_images_empleado.sql → 012_fase6_pagos_qr_tablas.sql |
| storage.s3_multipart_uploads_parts | r | supabase_storage_admin | Sí | No | {supabase_storage_admin=arwdDxtm/supabase_storage_admin,service_role=arwdDxtm/supabase_storage_admin,authenticated=r/supabase_storage_admin,anon=r/supabase_storage_admin} | 003_correccion_storage_product_images_empleado.sql → 012_fase6_pagos_qr_tablas.sql |
| storage.buckets_vectors | r | supabase_storage_admin | Sí | No | {supabase_storage_admin=arwdDxtm/supabase_storage_admin,service_role=r/supabase_storage_admin,authenticated=r/supabase_storage_admin,anon=r/supabase_storage_admin} | 003_correccion_storage_product_images_empleado.sql → 012_fase6_pagos_qr_tablas.sql |
| storage.vector_indexes | r | supabase_storage_admin | Sí | No | {supabase_storage_admin=arwdDxtm/supabase_storage_admin,service_role=r/supabase_storage_admin,authenticated=r/supabase_storage_admin,anon=r/supabase_storage_admin} | 003_correccion_storage_product_images_empleado.sql → 012_fase6_pagos_qr_tablas.sql |
| realtime.schema_migrations | r | supabase_admin | No | No | {supabase_admin=arwdDxtm/supabase_admin,postgres=arwdDxtm/supabase_admin,dashboard_user=arwdDxtm/supabase_admin} | Plataforma Supabase; fuera del historial de aplicación |
| realtime.subscription | r | supabase_realtime_admin | No | No | {supabase_realtime_admin=arwdDxtm/supabase_realtime_admin,postgres=arwdDxtm/supabase_realtime_admin,dashboard_user=arwdDxtm/supabase_realtime_admin,anon=r/supabase_realtime_admin,authenticated=r/supabase_realtime_admin,service_role=r/supabase_realtime_admin} | Plataforma Supabase; fuera del historial de aplicación |
| public.profiles | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 004_correccion_rls_profiles.sql |
| public.categories | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 001_correccion_rls_fase2.sql → 002_correccion_rls_catalogo_empleado.sql → 018_catalogo_publico_rls.sql |
| supabase_migrations.schema_migrations | r | postgres | No | No | — | Plataforma Supabase; fuera del historial de aplicación |
| auth.scim_users | r | supabase_auth_admin | No | No | {postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.scim_tokens | r | supabase_auth_admin | No | No | {postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.mfa_recovery_code_sets | r | supabase_auth_admin | No | No | {postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| auth.mfa_recovery_codes | r | supabase_auth_admin | No | No | {postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} | Plataforma Supabase; fuera del historial de aplicación |
| public.product_components | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 001_correccion_rls_fase2.sql → 002_correccion_rls_catalogo_empleado.sql → 018_catalogo_publico_rls.sql |
| public.customization_options | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 007_fase4_arreglos_tablas.sql → 018_catalogo_publico_rls.sql |
| public.customers | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 009_fase5_pedidos_tablas.sql |
| public.inventory_reservations | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 009_fase5_pedidos_tablas.sql |
| public.order_items | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 009_fase5_pedidos_tablas.sql |
| public.cash_movements | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 022_fase10_caja_tablas.sql |
| public.cash_registers | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 022_fase10_caja_tablas.sql |
| public.cash_sessions | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 022_fase10_caja_tablas.sql |
| public.business_hours | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 027_fase13_tablas.sql |
| public.audit_logs | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 030_fase14_auditoria.sql |
| public.notifications | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 027_fase13_tablas.sql |
| public.audit_trail | v | postgres | No | No | {postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 030_fase14_auditoria.sql |
| public.customization_option_inventory_requirements | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 031_arma_tu_ramo_opciones_inventario.sql |
| public.inventory_adjustments | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 005_fase3_inventario_tablas.sql → 006_fase3_inventario_triggers.sql |
| public.inventory_entries | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 005_fase3_inventario_tablas.sql → 006_fase3_inventario_triggers.sql |
| public.inventory_items | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 005_fase3_inventario_tablas.sql → 028_fase13_funciones_y_triggers.sql |
| public.inventory_lots | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 005_fase3_inventario_tablas.sql |
| public.inventory_movements | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 005_fase3_inventario_tablas.sql |
| public.inventory_waste | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 005_fase3_inventario_tablas.sql → 006_fase3_inventario_triggers.sql |
| public.order_deletion_requests | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 018_fase9_tablas.sql |
| public.order_discounts | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 024_fase11_clientes_promociones_tablas.sql → 033_reparacion_promociones.sql |
| public.orders | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 009_fase5_pedidos_tablas.sql → 018_fase9_tablas.sql → 028_fase13_funciones_y_triggers.sql |
| public.payment_qr_config | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 012_fase6_pagos_qr_tablas.sql |
| public.payments | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 012_fase6_pagos_qr_tablas.sql → 028_fase13_funciones_y_triggers.sql |
| public.product_images | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 001_correccion_rls_fase2.sql → 002_correccion_rls_catalogo_empleado.sql → 018_catalogo_publico_rls.sql |
| public.product_inventory_requirements | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 007_fase4_arreglos_tablas.sql |
| public.products | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 001_correccion_rls_fase2.sql → 002_correccion_rls_catalogo_empleado.sql → 018_catalogo_publico_rls.sql → 030_fase14_auditoria.sql |
| public.promotion_products | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 024_fase11_clientes_promociones_tablas.sql → 032_rediseno_promociones.sql → 033_reparacion_promociones.sql |
| public.promotions | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 024_fase11_clientes_promociones_tablas.sql → 032_rediseno_promociones.sql → 033_reparacion_promociones.sql |
| public.rate_limit_attempts | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 029_fase14_rate_limiting.sql |
| public.sale_returns | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 018_fase9_tablas.sql |
| public.seasons | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 001_correccion_rls_fase2.sql → 002_correccion_rls_catalogo_empleado.sql → 018_catalogo_publico_rls.sql |
| public.system_settings | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 027_fase13_tablas.sql |
| public.whatsapp_config | r | postgres | Sí | No | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} | 015_fase7_whatsapp_config.sql |

## auth.audit_log_entries

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| instance_id | uuid | No | — |  |  |
| id | uuid | Sí | — |  |  |
| payload | json | No | — |  |  |
| created_at | timestamp with time zone | No | — |  |  |
| ip_address | character varying(64) | Sí | ''::character varying |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| audit_log_entries_pkey | p | PRIMARY KEY (id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| audit_log_entries_pkey | CREATE UNIQUE INDEX audit_log_entries_pkey ON auth.audit_log_entries USING btree (id) |
| audit_logs_instance_id_idx | CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id) |

## auth.custom_oauth_providers

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| provider_type | text | Sí | — |  |  |
| identifier | text | Sí | — |  |  |
| name | text | Sí | — |  |  |
| client_id | text | Sí | — |  |  |
| client_secret | text | Sí | — |  |  |
| acceptable_client_ids | text[] | Sí | '{}'::text[] |  |  |
| scopes | text[] | Sí | '{}'::text[] |  |  |
| pkce_enabled | boolean | Sí | true |  |  |
| attribute_mapping | jsonb | Sí | '{}'::jsonb |  |  |
| authorization_params | jsonb | Sí | '{}'::jsonb |  |  |
| enabled | boolean | Sí | true |  |  |
| email_optional | boolean | Sí | false |  |  |
| issuer | text | No | — |  |  |
| discovery_url | text | No | — |  |  |
| skip_nonce_check | boolean | Sí | false |  |  |
| cached_discovery | jsonb | No | — |  |  |
| discovery_cached_at | timestamp with time zone | No | — |  |  |
| authorization_url | text | No | — |  |  |
| token_url | text | No | — |  |  |
| userinfo_url | text | No | — |  |  |
| jwks_uri | text | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |
| custom_claims_allowlist | text[] | Sí | '{}'::text[] |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| custom_oauth_providers_provider_type_check | c | CHECK (provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text])) | Sí |
| custom_oauth_providers_oidc_requires_issuer | c | CHECK (provider_type <> 'oidc'::text OR issuer IS NOT NULL) | Sí |
| custom_oauth_providers_oidc_issuer_https | c | CHECK (provider_type <> 'oidc'::text OR issuer IS NULL OR issuer ~~ 'https://%'::text) | Sí |
| custom_oauth_providers_oidc_discovery_url_https | c | CHECK (provider_type <> 'oidc'::text OR discovery_url IS NULL OR discovery_url ~~ 'https://%'::text) | Sí |
| custom_oauth_providers_oauth2_requires_endpoints | c | CHECK (provider_type <> 'oauth2'::text OR authorization_url IS NOT NULL AND token_url IS NOT NULL AND userinfo_url IS NOT NULL) | Sí |
| custom_oauth_providers_authorization_url_https | c | CHECK (authorization_url IS NULL OR authorization_url ~~ 'https://%'::text) | Sí |
| custom_oauth_providers_token_url_https | c | CHECK (token_url IS NULL OR token_url ~~ 'https://%'::text) | Sí |
| custom_oauth_providers_userinfo_url_https | c | CHECK (userinfo_url IS NULL OR userinfo_url ~~ 'https://%'::text) | Sí |
| custom_oauth_providers_jwks_uri_https | c | CHECK (jwks_uri IS NULL OR jwks_uri ~~ 'https://%'::text) | Sí |
| custom_oauth_providers_identifier_format | c | CHECK (identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text) | Sí |
| custom_oauth_providers_name_length | c | CHECK (char_length(name) >= 1 AND char_length(name) <= 100) | Sí |
| custom_oauth_providers_issuer_length | c | CHECK (issuer IS NULL OR char_length(issuer) >= 1 AND char_length(issuer) <= 2048) | Sí |
| custom_oauth_providers_discovery_url_length | c | CHECK (discovery_url IS NULL OR char_length(discovery_url) <= 2048) | Sí |
| custom_oauth_providers_authorization_url_length | c | CHECK (authorization_url IS NULL OR char_length(authorization_url) <= 2048) | Sí |
| custom_oauth_providers_token_url_length | c | CHECK (token_url IS NULL OR char_length(token_url) <= 2048) | Sí |
| custom_oauth_providers_userinfo_url_length | c | CHECK (userinfo_url IS NULL OR char_length(userinfo_url) <= 2048) | Sí |
| custom_oauth_providers_jwks_uri_length | c | CHECK (jwks_uri IS NULL OR char_length(jwks_uri) <= 2048) | Sí |
| custom_oauth_providers_client_id_length | c | CHECK (char_length(client_id) >= 1 AND char_length(client_id) <= 512) | Sí |
| custom_oauth_providers_pkey | p | PRIMARY KEY (id) | Sí |
| custom_oauth_providers_identifier_key | u | UNIQUE (identifier) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| custom_oauth_providers_pkey | CREATE UNIQUE INDEX custom_oauth_providers_pkey ON auth.custom_oauth_providers USING btree (id) |
| custom_oauth_providers_identifier_key | CREATE UNIQUE INDEX custom_oauth_providers_identifier_key ON auth.custom_oauth_providers USING btree (identifier) |
| custom_oauth_providers_identifier_idx | CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier) |
| custom_oauth_providers_provider_type_idx | CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type) |
| custom_oauth_providers_enabled_idx | CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled) |
| custom_oauth_providers_created_at_idx | CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at) |

## auth.flow_state

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| user_id | uuid | No | — |  |  |
| auth_code | text | No | — |  |  |
| code_challenge_method | auth.code_challenge_method | No | — |  |  |
| code_challenge | text | No | — |  |  |
| provider_type | text | Sí | — |  |  |
| provider_access_token | text | No | — |  |  |
| provider_refresh_token | text | No | — |  |  |
| created_at | timestamp with time zone | No | — |  |  |
| updated_at | timestamp with time zone | No | — |  |  |
| authentication_method | text | Sí | — |  |  |
| auth_code_issued_at | timestamp with time zone | No | — |  |  |
| invite_token | text | No | — |  |  |
| referrer | text | No | — |  |  |
| oauth_client_state_id | uuid | No | — |  |  |
| linking_target_id | uuid | No | — |  |  |
| email_optional | boolean | Sí | false |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| flow_state_pkey | p | PRIMARY KEY (id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| flow_state_pkey | CREATE UNIQUE INDEX flow_state_pkey ON auth.flow_state USING btree (id) |
| idx_auth_code | CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code) |
| idx_user_id_auth_method | CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method) |
| flow_state_created_at_idx | CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC) |

## auth.identities

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| provider_id | text | Sí | — |  |  |
| user_id | uuid | Sí | — |  |  |
| identity_data | jsonb | Sí | — |  |  |
| provider | text | Sí | — |  |  |
| last_sign_in_at | timestamp with time zone | No | — |  |  |
| created_at | timestamp with time zone | No | — |  |  |
| updated_at | timestamp with time zone | No | — |  |  |
| email | text | No | lower((identity_data ->> 'email'::text)) |  | s |
| id | uuid | Sí | gen_random_uuid() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| identities_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE | Sí |
| identities_pkey | p | PRIMARY KEY (id) | Sí |
| identities_provider_id_provider_unique | u | UNIQUE (provider_id, provider) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| identities_user_id_idx | CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id) |
| identities_email_idx | CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops) |
| identities_pkey | CREATE UNIQUE INDEX identities_pkey ON auth.identities USING btree (id) |
| identities_provider_id_provider_unique | CREATE UNIQUE INDEX identities_provider_id_provider_unique ON auth.identities USING btree (provider_id, provider) |

## auth.instances

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| uuid | uuid | No | — |  |  |
| raw_base_config | text | No | — |  |  |
| created_at | timestamp with time zone | No | — |  |  |
| updated_at | timestamp with time zone | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| instances_pkey | p | PRIMARY KEY (id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| instances_pkey | CREATE UNIQUE INDEX instances_pkey ON auth.instances USING btree (id) |

## auth.mfa_amr_claims

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| session_id | uuid | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | — |  |  |
| updated_at | timestamp with time zone | Sí | — |  |  |
| authentication_method | text | Sí | — |  |  |
| id | uuid | Sí | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| mfa_amr_claims_session_id_authentication_method_pkey | u | UNIQUE (session_id, authentication_method) | Sí |
| mfa_amr_claims_session_id_fkey | f | FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE | Sí |
| amr_id_pk | p | PRIMARY KEY (id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| mfa_amr_claims_session_id_authentication_method_pkey | CREATE UNIQUE INDEX mfa_amr_claims_session_id_authentication_method_pkey ON auth.mfa_amr_claims USING btree (session_id, authentication_method) |
| amr_id_pk | CREATE UNIQUE INDEX amr_id_pk ON auth.mfa_amr_claims USING btree (id) |

## auth.mfa_challenges

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| factor_id | uuid | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | — |  |  |
| verified_at | timestamp with time zone | No | — |  |  |
| ip_address | inet | Sí | — |  |  |
| otp_code | text | No | — |  |  |
| web_authn_session_data | jsonb | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| mfa_challenges_pkey | p | PRIMARY KEY (id) | Sí |
| mfa_challenges_auth_factor_id_fkey | f | FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| mfa_challenges_pkey | CREATE UNIQUE INDEX mfa_challenges_pkey ON auth.mfa_challenges USING btree (id) |
| mfa_challenge_created_at_idx | CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC) |

## auth.mfa_factors

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| user_id | uuid | Sí | — |  |  |
| friendly_name | text | No | — |  |  |
| factor_type | auth.factor_type | Sí | — |  |  |
| status | auth.factor_status | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | — |  |  |
| updated_at | timestamp with time zone | Sí | — |  |  |
| secret | text | No | — |  |  |
| phone | text | No | — |  |  |
| last_challenged_at | timestamp with time zone | No | — |  |  |
| web_authn_credential | jsonb | No | — |  |  |
| web_authn_aaguid | uuid | No | — |  |  |
| last_webauthn_challenge_data | jsonb | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| mfa_factors_pkey | p | PRIMARY KEY (id) | Sí |
| mfa_factors_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE | Sí |
| mfa_factors_last_challenged_at_key | u | UNIQUE (last_challenged_at) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| mfa_factors_pkey | CREATE UNIQUE INDEX mfa_factors_pkey ON auth.mfa_factors USING btree (id) |
| mfa_factors_user_friendly_name_unique | CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text) |
| factor_id_created_at_idx | CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at) |
| mfa_factors_user_id_idx | CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id) |
| unique_phone_factor_per_user | CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone) |
| mfa_factors_last_challenged_at_key | CREATE UNIQUE INDEX mfa_factors_last_challenged_at_key ON auth.mfa_factors USING btree (last_challenged_at) |

## auth.mfa_recovery_code_sets

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| user_id | uuid | Sí | — |  |  |
| mfa_factor_id | uuid | Sí | — |  |  |
| failed_verification_count | integer | Sí | 0 |  |  |
| verification_locked_until | timestamp with time zone | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| mfa_recovery_code_sets_failed_verification_count_check | c | CHECK (failed_verification_count >= 0) | Sí |
| mfa_recovery_code_sets_pkey | p | PRIMARY KEY (id) | Sí |
| mfa_recovery_code_sets_user_id_key | u | UNIQUE (user_id) | Sí |
| mfa_recovery_code_sets_mfa_factor_id_key | u | UNIQUE (mfa_factor_id) | Sí |
| mfa_recovery_code_sets_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE | Sí |
| mfa_recovery_code_sets_mfa_factor_id_fkey | f | FOREIGN KEY (mfa_factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| mfa_recovery_code_sets_pkey | CREATE UNIQUE INDEX mfa_recovery_code_sets_pkey ON auth.mfa_recovery_code_sets USING btree (id) |
| mfa_recovery_code_sets_user_id_key | CREATE UNIQUE INDEX mfa_recovery_code_sets_user_id_key ON auth.mfa_recovery_code_sets USING btree (user_id) |
| mfa_recovery_code_sets_mfa_factor_id_key | CREATE UNIQUE INDEX mfa_recovery_code_sets_mfa_factor_id_key ON auth.mfa_recovery_code_sets USING btree (mfa_factor_id) |

## auth.mfa_recovery_codes

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| mfa_recovery_code_set_id | uuid | Sí | — |  |  |
| code_hash | text | Sí | — |  |  |
| consumed_at | timestamp with time zone | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| mfa_recovery_codes_pkey | p | PRIMARY KEY (id) | Sí |
| mfa_recovery_codes_mfa_recovery_code_set_id_fkey | f | FOREIGN KEY (mfa_recovery_code_set_id) REFERENCES auth.mfa_recovery_code_sets(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| mfa_recovery_codes_pkey | CREATE UNIQUE INDEX mfa_recovery_codes_pkey ON auth.mfa_recovery_codes USING btree (id) |
| mfa_recovery_codes_set_id_idx | CREATE INDEX mfa_recovery_codes_set_id_idx ON auth.mfa_recovery_codes USING btree (mfa_recovery_code_set_id) |

## auth.oauth_authorizations

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| authorization_id | text | Sí | — |  |  |
| client_id | uuid | Sí | — |  |  |
| user_id | uuid | No | — |  |  |
| redirect_uri | text | Sí | — |  |  |
| scope | text | Sí | — |  |  |
| state | text | No | — |  |  |
| resource | text | No | — |  |  |
| code_challenge | text | No | — |  |  |
| code_challenge_method | auth.code_challenge_method | No | — |  |  |
| response_type | auth.oauth_response_type | Sí | 'code'::auth.oauth_response_type |  |  |
| status | auth.oauth_authorization_status | Sí | 'pending'::auth.oauth_authorization_status |  |  |
| authorization_code | text | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| expires_at | timestamp with time zone | Sí | (now() + '00:03:00'::interval) |  |  |
| approved_at | timestamp with time zone | No | — |  |  |
| nonce | text | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| oauth_authorizations_redirect_uri_length | c | CHECK (char_length(redirect_uri) <= 2048) | Sí |
| oauth_authorizations_scope_length | c | CHECK (char_length(scope) <= 4096) | Sí |
| oauth_authorizations_state_length | c | CHECK (char_length(state) <= 4096) | Sí |
| oauth_authorizations_resource_length | c | CHECK (char_length(resource) <= 2048) | Sí |
| oauth_authorizations_code_challenge_length | c | CHECK (char_length(code_challenge) <= 128) | Sí |
| oauth_authorizations_authorization_code_length | c | CHECK (char_length(authorization_code) <= 255) | Sí |
| oauth_authorizations_expires_at_future | c | CHECK (expires_at > created_at) | Sí |
| oauth_authorizations_pkey | p | PRIMARY KEY (id) | Sí |
| oauth_authorizations_authorization_id_key | u | UNIQUE (authorization_id) | Sí |
| oauth_authorizations_authorization_code_key | u | UNIQUE (authorization_code) | Sí |
| oauth_authorizations_client_id_fkey | f | FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE | Sí |
| oauth_authorizations_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE | Sí |
| oauth_authorizations_nonce_length | c | CHECK (char_length(nonce) <= 255) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| oauth_authorizations_pkey | CREATE UNIQUE INDEX oauth_authorizations_pkey ON auth.oauth_authorizations USING btree (id) |
| oauth_authorizations_authorization_id_key | CREATE UNIQUE INDEX oauth_authorizations_authorization_id_key ON auth.oauth_authorizations USING btree (authorization_id) |
| oauth_authorizations_authorization_code_key | CREATE UNIQUE INDEX oauth_authorizations_authorization_code_key ON auth.oauth_authorizations USING btree (authorization_code) |
| oauth_auth_pending_exp_idx | CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status) |

## auth.oauth_client_states

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| provider_type | text | Sí | — |  |  |
| code_verifier | text | No | — |  |  |
| created_at | timestamp with time zone | Sí | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| oauth_client_states_pkey | p | PRIMARY KEY (id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| oauth_client_states_pkey | CREATE UNIQUE INDEX oauth_client_states_pkey ON auth.oauth_client_states USING btree (id) |
| idx_oauth_client_states_created_at | CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at) |

## auth.oauth_clients

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| client_secret_hash | text | No | — |  |  |
| registration_type | auth.oauth_registration_type | Sí | — |  |  |
| redirect_uris | text | Sí | — |  |  |
| grant_types | text | Sí | — |  |  |
| client_name | text | No | — |  |  |
| client_uri | text | No | — |  |  |
| logo_uri | text | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |
| deleted_at | timestamp with time zone | No | — |  |  |
| client_type | auth.oauth_client_type | Sí | 'confidential'::auth.oauth_client_type |  |  |
| token_endpoint_auth_method | text | Sí | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| oauth_clients_client_name_length | c | CHECK (char_length(client_name) <= 1024) | Sí |
| oauth_clients_client_uri_length | c | CHECK (char_length(client_uri) <= 2048) | Sí |
| oauth_clients_logo_uri_length | c | CHECK (char_length(logo_uri) <= 2048) | Sí |
| oauth_clients_pkey | p | PRIMARY KEY (id) | Sí |
| oauth_clients_token_endpoint_auth_method_check | c | CHECK (token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| oauth_clients_pkey | CREATE UNIQUE INDEX oauth_clients_pkey ON auth.oauth_clients USING btree (id) |
| oauth_clients_deleted_at_idx | CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at) |

## auth.oauth_consents

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| user_id | uuid | Sí | — |  |  |
| client_id | uuid | Sí | — |  |  |
| scopes | text | Sí | — |  |  |
| granted_at | timestamp with time zone | Sí | now() |  |  |
| revoked_at | timestamp with time zone | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| oauth_consents_scopes_length | c | CHECK (char_length(scopes) <= 2048) | Sí |
| oauth_consents_scopes_not_empty | c | CHECK (char_length(TRIM(BOTH FROM scopes)) > 0) | Sí |
| oauth_consents_revoked_after_granted | c | CHECK (revoked_at IS NULL OR revoked_at >= granted_at) | Sí |
| oauth_consents_pkey | p | PRIMARY KEY (id) | Sí |
| oauth_consents_user_client_unique | u | UNIQUE (user_id, client_id) | Sí |
| oauth_consents_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE | Sí |
| oauth_consents_client_id_fkey | f | FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| oauth_consents_pkey | CREATE UNIQUE INDEX oauth_consents_pkey ON auth.oauth_consents USING btree (id) |
| oauth_consents_user_client_unique | CREATE UNIQUE INDEX oauth_consents_user_client_unique ON auth.oauth_consents USING btree (user_id, client_id) |
| oauth_consents_active_user_client_idx | CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL) |
| oauth_consents_user_order_idx | CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC) |
| oauth_consents_active_client_idx | CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL) |

## auth.one_time_tokens

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| user_id | uuid | Sí | — |  |  |
| token_type | auth.one_time_token_type | Sí | — |  |  |
| token_hash | text | Sí | — |  |  |
| relates_to | text | Sí | — |  |  |
| created_at | timestamp without time zone | Sí | now() |  |  |
| updated_at | timestamp without time zone | Sí | now() |  |  |
| expires_at | timestamp with time zone | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| one_time_tokens_token_hash_check | c | CHECK (char_length(token_hash) > 0) | Sí |
| one_time_tokens_pkey | p | PRIMARY KEY (id) | Sí |
| one_time_tokens_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| one_time_tokens_pkey | CREATE UNIQUE INDEX one_time_tokens_pkey ON auth.one_time_tokens USING btree (id) |
| one_time_tokens_token_hash_hash_idx | CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash) |
| one_time_tokens_relates_to_hash_idx | CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to) |
| one_time_tokens_user_id_token_type_key | CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type) |

## auth.refresh_tokens

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| instance_id | uuid | No | — |  |  |
| id | bigint | Sí | nextval('auth.refresh_tokens_id_seq'::regclass) |  |  |
| token | character varying(255) | No | — |  |  |
| user_id | character varying(255) | No | — |  |  |
| revoked | boolean | No | — |  |  |
| created_at | timestamp with time zone | No | — |  |  |
| updated_at | timestamp with time zone | No | — |  |  |
| parent | character varying(255) | No | — |  |  |
| session_id | uuid | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| refresh_tokens_pkey | p | PRIMARY KEY (id) | Sí |
| refresh_tokens_token_unique | u | UNIQUE (token) | Sí |
| refresh_tokens_session_id_fkey | f | FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| refresh_tokens_pkey | CREATE UNIQUE INDEX refresh_tokens_pkey ON auth.refresh_tokens USING btree (id) |
| refresh_tokens_instance_id_idx | CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id) |
| refresh_tokens_instance_id_user_id_idx | CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id) |
| refresh_tokens_token_unique | CREATE UNIQUE INDEX refresh_tokens_token_unique ON auth.refresh_tokens USING btree (token) |
| refresh_tokens_parent_idx | CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent) |
| refresh_tokens_session_id_revoked_idx | CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked) |
| refresh_tokens_updated_at_idx | CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC) |

## auth.saml_providers

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| sso_provider_id | uuid | Sí | — |  |  |
| entity_id | text | Sí | — |  |  |
| metadata_xml | text | Sí | — |  |  |
| metadata_url | text | No | — |  |  |
| attribute_mapping | jsonb | No | — |  |  |
| created_at | timestamp with time zone | No | — |  |  |
| updated_at | timestamp with time zone | No | — |  |  |
| name_id_format | text | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| metadata_xml not empty | c | CHECK (char_length(metadata_xml) > 0) | Sí |
| metadata_url not empty | c | CHECK (metadata_url = NULL::text OR char_length(metadata_url) > 0) | Sí |
| entity_id not empty | c | CHECK (char_length(entity_id) > 0) | Sí |
| saml_providers_pkey | p | PRIMARY KEY (id) | Sí |
| saml_providers_entity_id_key | u | UNIQUE (entity_id) | Sí |
| saml_providers_sso_provider_id_fkey | f | FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| saml_providers_pkey | CREATE UNIQUE INDEX saml_providers_pkey ON auth.saml_providers USING btree (id) |
| saml_providers_entity_id_key | CREATE UNIQUE INDEX saml_providers_entity_id_key ON auth.saml_providers USING btree (entity_id) |
| saml_providers_sso_provider_id_idx | CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id) |

## auth.saml_relay_states

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| sso_provider_id | uuid | Sí | — |  |  |
| request_id | text | Sí | — |  |  |
| for_email | text | No | — |  |  |
| redirect_to | text | No | — |  |  |
| created_at | timestamp with time zone | No | — |  |  |
| updated_at | timestamp with time zone | No | — |  |  |
| flow_state_id | uuid | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| request_id not empty | c | CHECK (char_length(request_id) > 0) | Sí |
| saml_relay_states_pkey | p | PRIMARY KEY (id) | Sí |
| saml_relay_states_sso_provider_id_fkey | f | FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE | Sí |
| saml_relay_states_flow_state_id_fkey | f | FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| saml_relay_states_pkey | CREATE UNIQUE INDEX saml_relay_states_pkey ON auth.saml_relay_states USING btree (id) |
| saml_relay_states_sso_provider_id_idx | CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id) |
| saml_relay_states_for_email_idx | CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email) |
| saml_relay_states_created_at_idx | CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC) |

## auth.schema_migrations

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| version | character varying(255) | Sí | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| schema_migrations_pkey | p | PRIMARY KEY (version) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| schema_migrations_pkey | CREATE UNIQUE INDEX schema_migrations_pkey ON auth.schema_migrations USING btree (version) |

## auth.scim_tokens

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| sso_provider_id | uuid | Sí | — |  |  |
| token_hash | text | Sí | — |  |  |
| prefix | text | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| expires_at | timestamp with time zone | No | — |  |  |
| revoked_at | timestamp with time zone | No | — |  |  |
| last_used_at | timestamp with time zone | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| scim_tokens_token_hash_check | c | CHECK (token_hash ~ '^[0-9a-f]{64}$'::text) | Sí |
| scim_tokens_expires_at_future | c | CHECK (expires_at IS NULL OR expires_at > created_at) | Sí |
| scim_tokens_revoked_after_created | c | CHECK (revoked_at IS NULL OR revoked_at >= created_at) | Sí |
| scim_tokens_pkey | p | PRIMARY KEY (id) | Sí |
| scim_tokens_sso_provider_id_fkey | f | FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| scim_tokens_pkey | CREATE UNIQUE INDEX scim_tokens_pkey ON auth.scim_tokens USING btree (id) |
| scim_tokens_token_hash_key | CREATE UNIQUE INDEX scim_tokens_token_hash_key ON auth.scim_tokens USING btree (token_hash) |
| scim_tokens_sso_provider_id_idx | CREATE INDEX scim_tokens_sso_provider_id_idx ON auth.scim_tokens USING btree (sso_provider_id) |
| scim_tokens_expires_at_idx | CREATE INDEX scim_tokens_expires_at_idx ON auth.scim_tokens USING btree (expires_at) |
| scim_tokens_revoked_at_idx | CREATE INDEX scim_tokens_revoked_at_idx ON auth.scim_tokens USING btree (revoked_at) |

## auth.scim_users

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| sso_provider_id | uuid | Sí | — |  |  |
| user_id | uuid | No | — |  |  |
| resource | jsonb | Sí | — |  |  |
| user_name | text | Sí | lower((resource ->> 'userName'::text)) |  | s |
| external_id | text | No | (resource ->> 'externalId'::text) |  | s |
| active | boolean | Sí | COALESCE(((resource ->> 'active'::text))::boolean, true) |  | s |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |
| deleted_at | timestamp with time zone | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| scim_users_pkey | p | PRIMARY KEY (id) | Sí |
| scim_users_sso_provider_id_fkey | f | FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE | Sí |
| scim_users_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| scim_users_pkey | CREATE UNIQUE INDEX scim_users_pkey ON auth.scim_users USING btree (id) |
| scim_users_user_name_key | CREATE UNIQUE INDEX scim_users_user_name_key ON auth.scim_users USING btree (sso_provider_id, user_name) WHERE (deleted_at IS NULL) |
| scim_users_external_id_key | CREATE UNIQUE INDEX scim_users_external_id_key ON auth.scim_users USING btree (sso_provider_id, external_id) WHERE ((external_id IS NOT NULL) AND (deleted_at IS NULL)) |
| scim_users_user_id_idx | CREATE INDEX scim_users_user_id_idx ON auth.scim_users USING btree (user_id) |
| scim_users_id_idx | CREATE INDEX scim_users_id_idx ON auth.scim_users USING btree (sso_provider_id, id) WHERE (deleted_at IS NULL) |
| scim_users_user_name_idx | CREATE INDEX scim_users_user_name_idx ON auth.scim_users USING btree (sso_provider_id, user_name COLLATE "C", id) WHERE (deleted_at IS NULL) |
| scim_users_created_at_idx | CREATE INDEX scim_users_created_at_idx ON auth.scim_users USING btree (sso_provider_id, created_at, id) WHERE (deleted_at IS NULL) |
| scim_users_updated_at_idx | CREATE INDEX scim_users_updated_at_idx ON auth.scim_users USING btree (sso_provider_id, updated_at, id) WHERE (deleted_at IS NULL) |
| scim_users_sso_provider_id_idx | CREATE INDEX scim_users_sso_provider_id_idx ON auth.scim_users USING btree (sso_provider_id) |
| scim_users_deleted_at_idx | CREATE INDEX scim_users_deleted_at_idx ON auth.scim_users USING btree (deleted_at) |

## auth.sessions

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| user_id | uuid | Sí | — |  |  |
| created_at | timestamp with time zone | No | — |  |  |
| updated_at | timestamp with time zone | No | — |  |  |
| factor_id | uuid | No | — |  |  |
| aal | auth.aal_level | No | — |  |  |
| not_after | timestamp with time zone | No | — |  |  |
| refreshed_at | timestamp without time zone | No | — |  |  |
| user_agent | text | No | — |  |  |
| ip | inet | No | — |  |  |
| tag | text | No | — |  |  |
| oauth_client_id | uuid | No | — |  |  |
| refresh_token_hmac_key | text | No | — |  |  |
| refresh_token_counter | bigint | No | — |  |  |
| scopes | text | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| sessions_pkey | p | PRIMARY KEY (id) | Sí |
| sessions_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE | Sí |
| sessions_oauth_client_id_fkey | f | FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE | Sí |
| sessions_scopes_length | c | CHECK (char_length(scopes) <= 4096) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| sessions_pkey | CREATE UNIQUE INDEX sessions_pkey ON auth.sessions USING btree (id) |
| user_id_created_at_idx | CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at) |
| sessions_user_id_idx | CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id) |
| sessions_not_after_idx | CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC) |
| sessions_oauth_client_id_idx | CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id) |

## auth.sso_domains

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| sso_provider_id | uuid | Sí | — |  |  |
| domain | text | Sí | — |  |  |
| created_at | timestamp with time zone | No | — |  |  |
| updated_at | timestamp with time zone | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| domain not empty | c | CHECK (char_length(domain) > 0) | Sí |
| sso_domains_pkey | p | PRIMARY KEY (id) | Sí |
| sso_domains_sso_provider_id_fkey | f | FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| sso_domains_pkey | CREATE UNIQUE INDEX sso_domains_pkey ON auth.sso_domains USING btree (id) |
| sso_domains_sso_provider_id_idx | CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id) |
| sso_domains_domain_idx | CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain)) |

## auth.sso_providers

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| resource_id | text | No | — |  |  |
| created_at | timestamp with time zone | No | — |  |  |
| updated_at | timestamp with time zone | No | — |  |  |
| disabled | boolean | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| resource_id not empty | c | CHECK (resource_id = NULL::text OR char_length(resource_id) > 0) | Sí |
| sso_providers_pkey | p | PRIMARY KEY (id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| sso_providers_pkey | CREATE UNIQUE INDEX sso_providers_pkey ON auth.sso_providers USING btree (id) |
| sso_providers_resource_id_idx | CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id)) |
| sso_providers_resource_id_pattern_idx | CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops) |

## auth.users

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| instance_id | uuid | No | — |  |  |
| id | uuid | Sí | — |  |  |
| aud | character varying(255) | No | — |  |  |
| role | character varying(255) | No | — |  |  |
| email | character varying(255) | No | — |  |  |
| encrypted_password | character varying(255) | No | — |  |  |
| email_confirmed_at | timestamp with time zone | No | — |  |  |
| invited_at | timestamp with time zone | No | — |  |  |
| confirmation_token | character varying(255) | No | — |  |  |
| confirmation_sent_at | timestamp with time zone | No | — |  |  |
| recovery_token | character varying(255) | No | — |  |  |
| recovery_sent_at | timestamp with time zone | No | — |  |  |
| email_change_token_new | character varying(255) | No | — |  |  |
| email_change | character varying(255) | No | — |  |  |
| email_change_sent_at | timestamp with time zone | No | — |  |  |
| last_sign_in_at | timestamp with time zone | No | — |  |  |
| raw_app_meta_data | jsonb | No | — |  |  |
| raw_user_meta_data | jsonb | No | — |  |  |
| is_super_admin | boolean | No | — |  |  |
| created_at | timestamp with time zone | No | — |  |  |
| updated_at | timestamp with time zone | No | — |  |  |
| phone | text | No | NULL::character varying |  |  |
| phone_confirmed_at | timestamp with time zone | No | — |  |  |
| phone_change | text | No | ''::character varying |  |  |
| phone_change_token | character varying(255) | No | ''::character varying |  |  |
| phone_change_sent_at | timestamp with time zone | No | — |  |  |
| confirmed_at | timestamp with time zone | No | LEAST(email_confirmed_at, phone_confirmed_at) |  | s |
| email_change_token_current | character varying(255) | No | ''::character varying |  |  |
| email_change_confirm_status | smallint | No | 0 |  |  |
| banned_until | timestamp with time zone | No | — |  |  |
| reauthentication_token | character varying(255) | No | ''::character varying |  |  |
| reauthentication_sent_at | timestamp with time zone | No | — |  |  |
| is_sso_user | boolean | Sí | false |  |  |
| deleted_at | timestamp with time zone | No | — |  |  |
| is_anonymous | boolean | Sí | false |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| users_pkey | p | PRIMARY KEY (id) | Sí |
| users_email_change_confirm_status_check | c | CHECK (email_change_confirm_status >= 0 AND email_change_confirm_status <= 2) | Sí |
| users_phone_key | u | UNIQUE (phone) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| users_pkey | CREATE UNIQUE INDEX users_pkey ON auth.users USING btree (id) |
| users_instance_id_idx | CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id) |
| users_instance_id_email_idx | CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text)) |
| confirmation_token_idx | CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text) |
| recovery_token_idx | CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text) |
| email_change_token_current_idx | CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text) |
| email_change_token_new_idx | CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text) |
| reauthentication_token_idx | CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text) |
| users_email_partial_key | CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false) |
| users_phone_key | CREATE UNIQUE INDEX users_phone_key ON auth.users USING btree (phone) |
| users_is_anonymous_idx | CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous) |
| idx_users_email | CREATE INDEX idx_users_email ON auth.users USING btree (email) |
| idx_users_created_at_desc | CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC) |
| idx_users_last_sign_in_at_desc | CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC) |
| idx_users_name | CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL) |

### Triggers

| Trigger | Enabled | Definición | Fuente local |
| --- | --- | --- | --- |
| on_auth_user_created | O | CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user() | MASTER_DATABASE_FLORERIA.sql / bootstrap |

## auth.webauthn_challenges

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| user_id | uuid | No | — |  |  |
| challenge_type | text | Sí | — |  |  |
| session_data | jsonb | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| expires_at | timestamp with time zone | Sí | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| webauthn_challenges_challenge_type_check | c | CHECK (challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])) | Sí |
| webauthn_challenges_pkey | p | PRIMARY KEY (id) | Sí |
| webauthn_challenges_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| webauthn_challenges_pkey | CREATE UNIQUE INDEX webauthn_challenges_pkey ON auth.webauthn_challenges USING btree (id) |
| webauthn_challenges_user_id_idx | CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id) |
| webauthn_challenges_expires_at_idx | CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at) |

## auth.webauthn_credentials

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| user_id | uuid | Sí | — |  |  |
| credential_id | bytea | Sí | — |  |  |
| public_key | bytea | Sí | — |  |  |
| attestation_type | text | Sí | ''::text |  |  |
| aaguid | uuid | No | — |  |  |
| sign_count | bigint | Sí | 0 |  |  |
| transports | jsonb | Sí | '[]'::jsonb |  |  |
| backup_eligible | boolean | Sí | false |  |  |
| backed_up | boolean | Sí | false |  |  |
| friendly_name | text | Sí | ''::text |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |
| last_used_at | timestamp with time zone | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| webauthn_credentials_pkey | p | PRIMARY KEY (id) | Sí |
| webauthn_credentials_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| webauthn_credentials_pkey | CREATE UNIQUE INDEX webauthn_credentials_pkey ON auth.webauthn_credentials USING btree (id) |
| webauthn_credentials_credential_id_key | CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id) |
| webauthn_credentials_user_id_idx | CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id) |

## extensions.pg_stat_statements

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| userid | oid | No | — |  |  |
| dbid | oid | No | — |  |  |
| toplevel | boolean | No | — |  |  |
| queryid | bigint | No | — |  |  |
| query | text | No | — |  |  |
| plans | bigint | No | — |  |  |
| total_plan_time | double precision | No | — |  |  |
| min_plan_time | double precision | No | — |  |  |
| max_plan_time | double precision | No | — |  |  |
| mean_plan_time | double precision | No | — |  |  |
| stddev_plan_time | double precision | No | — |  |  |
| calls | bigint | No | — |  |  |
| total_exec_time | double precision | No | — |  |  |
| min_exec_time | double precision | No | — |  |  |
| max_exec_time | double precision | No | — |  |  |
| mean_exec_time | double precision | No | — |  |  |
| stddev_exec_time | double precision | No | — |  |  |
| rows | bigint | No | — |  |  |
| shared_blks_hit | bigint | No | — |  |  |
| shared_blks_read | bigint | No | — |  |  |
| shared_blks_dirtied | bigint | No | — |  |  |
| shared_blks_written | bigint | No | — |  |  |
| local_blks_hit | bigint | No | — |  |  |
| local_blks_read | bigint | No | — |  |  |
| local_blks_dirtied | bigint | No | — |  |  |
| local_blks_written | bigint | No | — |  |  |
| temp_blks_read | bigint | No | — |  |  |
| temp_blks_written | bigint | No | — |  |  |
| shared_blk_read_time | double precision | No | — |  |  |
| shared_blk_write_time | double precision | No | — |  |  |
| local_blk_read_time | double precision | No | — |  |  |
| local_blk_write_time | double precision | No | — |  |  |
| temp_blk_read_time | double precision | No | — |  |  |
| temp_blk_write_time | double precision | No | — |  |  |
| wal_records | bigint | No | — |  |  |
| wal_fpi | bigint | No | — |  |  |
| wal_bytes | numeric | No | — |  |  |
| jit_functions | bigint | No | — |  |  |
| jit_generation_time | double precision | No | — |  |  |
| jit_inlining_count | bigint | No | — |  |  |
| jit_inlining_time | double precision | No | — |  |  |
| jit_optimization_count | bigint | No | — |  |  |
| jit_optimization_time | double precision | No | — |  |  |
| jit_emission_count | bigint | No | — |  |  |
| jit_emission_time | double precision | No | — |  |  |
| jit_deform_count | bigint | No | — |  |  |
| jit_deform_time | double precision | No | — |  |  |
| stats_since | timestamp with time zone | No | — |  |  |
| minmax_stats_since | timestamp with time zone | No | — |  |  |

## extensions.pg_stat_statements_info

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| dealloc | bigint | No | — |  |  |
| stats_reset | timestamp with time zone | No | — |  |  |

## public.audit_logs

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| user_id | uuid | No | — |  |  |
| action | text | Sí | — |  |  |
| table_name | text | Sí | — |  |  |
| record_id | uuid | Sí | — |  |  |
| before | jsonb | No | — |  |  |
| after | jsonb | No | — |  |  |
| reason | text | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| audit_logs_pkey | p | PRIMARY KEY (id) | Sí |
| audit_logs_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| audit_logs_pkey | CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id) |
| idx_audit_logs_table_record | CREATE INDEX idx_audit_logs_table_record ON public.audit_logs USING btree (table_name, record_id, created_at DESC) |
| idx_audit_logs_created_at | CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC) |

## public.audit_trail

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| user_id | uuid | No | — |  |  |
| action | text | No | — |  |  |
| table_name | text | No | — |  |  |
| record_id | uuid | No | — |  |  |
| before | jsonb | No | — |  |  |
| after | jsonb | No | — |  |  |
| reason | text | No | — |  |  |
| created_at | timestamp with time zone | No | — |  |  |

## public.business_hours

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| day_of_week | smallint | Sí | — |  |  |
| opens_at | time without time zone | No | — |  |  |
| closes_at | time without time zone | No | — |  |  |
| is_closed | boolean | Sí | false |  |  |
| updated_by | uuid | No | — |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| business_hours_day_of_week_check | c | CHECK (day_of_week >= 0 AND day_of_week <= 6) | Sí |
| business_hours_hours_valid | c | CHECK (is_closed = true OR opens_at IS NOT NULL AND closes_at IS NOT NULL AND opens_at < closes_at) | Sí |
| business_hours_pkey | p | PRIMARY KEY (id) | Sí |
| business_hours_day_unique | u | UNIQUE (day_of_week) | Sí |
| business_hours_updated_by_fkey | f | FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| business_hours_pkey | CREATE UNIQUE INDEX business_hours_pkey ON public.business_hours USING btree (id) |
| business_hours_day_unique | CREATE UNIQUE INDEX business_hours_day_unique ON public.business_hours USING btree (day_of_week) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| business_hours_public_select | anon, authenticated | SELECT | PERMISSIVE | true | — | 027_fase13_tablas.sql |
| business_hours_admin_update | authenticated | UPDATE | PERMISSIVE | is_admin() | is_admin() | 027_fase13_tablas.sql |

## public.cash_movements

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| cash_session_id | uuid | Sí | — |  |  |
| movement_type | text | Sí | — |  |  |
| payment_method | text | No | — |  |  |
| amount | numeric(12,2) | Sí | — |  |  |
| direction | text | No | — |  |  |
| order_id | uuid | No | — |  |  |
| reason | text | No | — |  |  |
| created_by | uuid | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| cash_movements_pkey | p | PRIMARY KEY (id) | Sí |
| cash_movements_amount_check | c | CHECK (amount > 0::numeric) | Sí |
| cash_movements_cash_session_id_fkey | f | FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id) ON DELETE RESTRICT | Sí |
| cash_movements_direction_check | c | CHECK (direction = ANY (ARRAY['entrada'::text, 'salida'::text])) | Sí |
| cash_movements_order_id_fkey | f | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT | Sí |
| cash_movements_direction_only_for_ajuste | c | CHECK (movement_type = 'ajuste'::text AND direction IS NOT NULL OR movement_type <> 'ajuste'::text AND direction IS NULL) | Sí |
| cash_movements_movement_type_check | c | CHECK (movement_type = ANY (ARRAY['venta'::text, 'ingreso'::text, 'gasto'::text, 'ajuste'::text, 'devolucion'::text])) | Sí |
| cash_movements_payment_method_check | c | CHECK (payment_method = ANY (ARRAY['qr'::text, 'efectivo'::text, 'otro'::text])) | Sí |
| cash_movements_created_by_fkey | f | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| cash_movements_pkey | CREATE UNIQUE INDEX cash_movements_pkey ON public.cash_movements USING btree (id) |
| idx_cash_movements_session | CREATE INDEX idx_cash_movements_session ON public.cash_movements USING btree (cash_session_id, created_at) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| cash_movements_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 022_fase10_caja_tablas.sql |

## public.cash_registers

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| name | text | Sí | 'Caja principal'::text |  |  |
| is_active | boolean | Sí | true |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| cash_registers_pkey | p | PRIMARY KEY (id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| cash_registers_pkey | CREATE UNIQUE INDEX cash_registers_pkey ON public.cash_registers USING btree (id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| cash_registers_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 022_fase10_caja_tablas.sql |

## public.cash_sessions

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| cash_register_id | uuid | Sí | — |  |  |
| opened_by | uuid | Sí | — |  |  |
| opened_at | timestamp with time zone | Sí | now() |  |  |
| opening_amount | numeric(12,2) | Sí | 0 |  |  |
| closed_by | uuid | No | — |  |  |
| closed_at | timestamp with time zone | No | — |  |  |
| expected_amount | numeric(12,2) | No | — |  |  |
| counted_amount | numeric(12,2) | No | — |  |  |
| difference_amount | numeric(12,2) | No | — |  |  |
| status | text | Sí | 'abierta'::text |  |  |
| closing_note | text | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| cash_sessions_opening_amount_check | c | CHECK (opening_amount >= 0::numeric) | Sí |
| cash_sessions_status_check | c | CHECK (status = ANY (ARRAY['abierta'::text, 'cerrada'::text])) | Sí |
| cash_sessions_pkey | p | PRIMARY KEY (id) | Sí |
| cash_sessions_cash_register_id_fkey | f | FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE RESTRICT | Sí |
| cash_sessions_opened_by_fkey | f | FOREIGN KEY (opened_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |
| cash_sessions_closed_by_fkey | f | FOREIGN KEY (closed_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| cash_sessions_pkey | CREATE UNIQUE INDEX cash_sessions_pkey ON public.cash_sessions USING btree (id) |
| idx_cash_sessions_register_status | CREATE INDEX idx_cash_sessions_register_status ON public.cash_sessions USING btree (cash_register_id, status) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| cash_sessions_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 022_fase10_caja_tablas.sql |

## public.categories

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| name | text | Sí | — |  |  |
| description | text | No | — |  |  |
| is_active | boolean | Sí | true |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| categories_pkey | p | PRIMARY KEY (id) | Sí |
| categories_name_unique | u | UNIQUE (name) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| categories_pkey | CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id) |
| categories_name_unique | CREATE UNIQUE INDEX categories_name_unique ON public.categories USING btree (name) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| categories_admin_insert | authenticated | INSERT | PERMISSIVE | — | is_admin() | Fuera del estado local final |
| categories_admin_update | authenticated | UPDATE | PERMISSIVE | is_admin() | is_admin() | Fuera del estado local final |
| categories_admin_select | authenticated | SELECT | PERMISSIVE | is_admin() | — | Fuera del estado local final |
| categories_employee_admin_all | authenticated | ALL | PERMISSIVE | is_employee_or_admin() | is_employee_or_admin() | 002_correccion_rls_catalogo_empleado.sql |
| categories_public_select | anon, authenticated | SELECT | PERMISSIVE | (is_active = true) | — | 018_catalogo_publico_rls.sql |

## public.customers

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| name | text | Sí | — |  |  |
| phone | text | No | — |  |  |
| whatsapp | text | No | — |  |  |
| email | text | No | — |  |  |
| birthday | date | No | — |  |  |
| is_active | boolean | Sí | true |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| customers_pkey | p | PRIMARY KEY (id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| customers_pkey | CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| customers_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 009_fase5_pedidos_tablas.sql |
| customers_staff_insert | authenticated | INSERT | PERMISSIVE | — | is_employee_or_admin() | 009_fase5_pedidos_tablas.sql |
| customers_staff_update | authenticated | UPDATE | PERMISSIVE | is_employee_or_admin() | is_employee_or_admin() | 009_fase5_pedidos_tablas.sql |

## public.customization_option_inventory_requirements

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| customization_option_id | uuid | Sí | — |  |  |
| inventory_item_id | uuid | Sí | — |  |  |
| quantity | numeric(12,3) | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| customization_option_inventory_requirements_quantity_check | c | CHECK (quantity > 0::numeric) | Sí |
| customization_option_inventory_requirements_pkey | p | PRIMARY KEY (id) | Sí |
| coir_unique | u | UNIQUE (customization_option_id, inventory_item_id) | Sí |
| customization_option_inventory_req_customization_option_id_fkey | f | FOREIGN KEY (customization_option_id) REFERENCES customization_options(id) ON DELETE CASCADE | Sí |
| customization_option_inventory_requireme_inventory_item_id_fkey | f | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| customization_option_inventory_requirements_pkey | CREATE UNIQUE INDEX customization_option_inventory_requirements_pkey ON public.customization_option_inventory_requirements USING btree (id) |
| coir_unique | CREATE UNIQUE INDEX coir_unique ON public.customization_option_inventory_requirements USING btree (customization_option_id, inventory_item_id) |
| idx_coir_option | CREATE INDEX idx_coir_option ON public.customization_option_inventory_requirements USING btree (customization_option_id) |
| idx_coir_item | CREATE INDEX idx_coir_item ON public.customization_option_inventory_requirements USING btree (inventory_item_id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| coir_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 031_arma_tu_ramo_opciones_inventario.sql |
| coir_staff_insert | authenticated | INSERT | PERMISSIVE | — | is_employee_or_admin() | 031_arma_tu_ramo_opciones_inventario.sql |
| coir_staff_update | authenticated | UPDATE | PERMISSIVE | is_employee_or_admin() | is_employee_or_admin() | 031_arma_tu_ramo_opciones_inventario.sql |
| coir_staff_delete | authenticated | DELETE | PERMISSIVE | is_employee_or_admin() | — | 031_arma_tu_ramo_opciones_inventario.sql |

## public.customization_options

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| product_id | uuid | Sí | — |  |  |
| option_type | text | Sí | — |  |  |
| name | text | Sí | — |  |  |
| value | text | No | — |  |  |
| extra_price | numeric(12,2) | Sí | 0 |  |  |
| is_active | boolean | Sí | true |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| customization_options_option_type_check | c | CHECK (option_type = ANY (ARRAY['cantidad_rosas'::text, 'color'::text, 'tipo_flor'::text, 'oso'::text, 'decoracion'::text, 'otro'::text])) | Sí |
| customization_options_extra_price_check | c | CHECK (extra_price >= 0::numeric) | Sí |
| customization_options_pkey | p | PRIMARY KEY (id) | Sí |
| customization_options_product_id_fkey | f | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| customization_options_pkey | CREATE UNIQUE INDEX customization_options_pkey ON public.customization_options USING btree (id) |
| idx_customization_product | CREATE INDEX idx_customization_product ON public.customization_options USING btree (product_id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| customization_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 007_fase4_arreglos_tablas.sql |
| customization_staff_insert | authenticated | INSERT | PERMISSIVE | — | is_employee_or_admin() | 007_fase4_arreglos_tablas.sql |
| customization_staff_update | authenticated | UPDATE | PERMISSIVE | is_employee_or_admin() | is_employee_or_admin() | 007_fase4_arreglos_tablas.sql |
| customization_staff_delete | authenticated | DELETE | PERMISSIVE | is_employee_or_admin() | — | 007_fase4_arreglos_tablas.sql |
| customization_options_public_select | anon, authenticated | SELECT | PERMISSIVE | ((is_active = true) AND (EXISTS ( SELECT 1    FROM products p   WHERE ((p.id = customization_options.product_id) AND (p.is_active = true))))) | — | 018_catalogo_publico_rls.sql |

## public.inventory_adjustments

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| inventory_item_id | uuid | Sí | — |  |  |
| quantity_delta | numeric(12,3) | Sí | — |  |  |
| reason | text | Sí | — |  |  |
| created_by | uuid | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| inventory_adjustments_created_by_fkey | f | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |
| inventory_adjustments_quantity_delta_check | c | CHECK (quantity_delta <> 0::numeric) | Sí |
| inventory_adjustments_pkey | p | PRIMARY KEY (id) | Sí |
| inventory_adjustments_inventory_item_id_fkey | f | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| inventory_adjustments_pkey | CREATE UNIQUE INDEX inventory_adjustments_pkey ON public.inventory_adjustments USING btree (id) |
| idx_inventory_adjustments_item | CREATE INDEX idx_inventory_adjustments_item ON public.inventory_adjustments USING btree (inventory_item_id, created_at) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| inventory_adjustments_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 005_fase3_inventario_tablas.sql |
| inventory_adjustments_staff_insert | authenticated | INSERT | PERMISSIVE | — | is_employee_or_admin() | 005_fase3_inventario_tablas.sql |

### Triggers

| Trigger | Enabled | Definición | Fuente local |
| --- | --- | --- | --- |
| trg_inventory_adjustment_created | O | CREATE TRIGGER trg_inventory_adjustment_created AFTER INSERT ON inventory_adjustments FOR EACH ROW EXECUTE FUNCTION handle_inventory_adjustment() | 006_fase3_inventario_triggers.sql |

## public.inventory_entries

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| inventory_item_id | uuid | Sí | — |  |  |
| quantity | numeric(12,3) | Sí | — |  |  |
| unit_cost | numeric(12,2) | No | — |  |  |
| supplier_name | text | No | — |  |  |
| notes | text | No | — |  |  |
| received_at | timestamp with time zone | Sí | now() |  |  |
| created_by | uuid | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| inventory_entries_quantity_check | c | CHECK (quantity > 0::numeric) | Sí |
| inventory_entries_unit_cost_check | c | CHECK (unit_cost >= 0::numeric) | Sí |
| inventory_entries_pkey | p | PRIMARY KEY (id) | Sí |
| inventory_entries_inventory_item_id_fkey | f | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT | Sí |
| inventory_entries_created_by_fkey | f | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| inventory_entries_pkey | CREATE UNIQUE INDEX inventory_entries_pkey ON public.inventory_entries USING btree (id) |
| idx_inventory_entries_item | CREATE INDEX idx_inventory_entries_item ON public.inventory_entries USING btree (inventory_item_id, received_at) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| inventory_entries_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 005_fase3_inventario_tablas.sql |
| inventory_entries_staff_insert | authenticated | INSERT | PERMISSIVE | — | is_employee_or_admin() | 005_fase3_inventario_tablas.sql |

### Triggers

| Trigger | Enabled | Definición | Fuente local |
| --- | --- | --- | --- |
| trg_inventory_entry_created | O | CREATE TRIGGER trg_inventory_entry_created AFTER INSERT ON inventory_entries FOR EACH ROW EXECUTE FUNCTION handle_inventory_entry() | 006_fase3_inventario_triggers.sql |

## public.inventory_items

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| name | text | Sí | — |  |  |
| sku | text | No | — |  |  |
| item_type | text | Sí | — |  |  |
| unit | text | Sí | 'unidad'::text |  |  |
| current_stock | numeric(12,3) | Sí | 0 |  |  |
| minimum_stock | numeric(12,3) | Sí | 0 |  |  |
| is_active | boolean | Sí | true |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| inventory_items_item_type_check | c | CHECK (item_type = ANY (ARRAY['flor'::text, 'insumo'::text, 'componente'::text, 'producto'::text])) | Sí |
| inventory_items_current_stock_check | c | CHECK (current_stock >= 0::numeric) | Sí |
| inventory_items_minimum_stock_check | c | CHECK (minimum_stock >= 0::numeric) | Sí |
| inventory_items_pkey | p | PRIMARY KEY (id) | Sí |
| inventory_items_sku_unique | u | UNIQUE (sku) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| inventory_items_pkey | CREATE UNIQUE INDEX inventory_items_pkey ON public.inventory_items USING btree (id) |
| inventory_items_sku_unique | CREATE UNIQUE INDEX inventory_items_sku_unique ON public.inventory_items USING btree (sku) |
| idx_inventory_items_type | CREATE INDEX idx_inventory_items_type ON public.inventory_items USING btree (item_type) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| inventory_items_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 005_fase3_inventario_tablas.sql |
| inventory_items_staff_insert | authenticated | INSERT | PERMISSIVE | — | is_employee_or_admin() | 005_fase3_inventario_tablas.sql |
| inventory_items_staff_update | authenticated | UPDATE | PERMISSIVE | is_employee_or_admin() | is_employee_or_admin() | 005_fase3_inventario_tablas.sql |

### Triggers

| Trigger | Enabled | Definición | Fuente local |
| --- | --- | --- | --- |
| trg_notify_stock_alert | O | CREATE TRIGGER trg_notify_stock_alert AFTER UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION notify_stock_alert() | 028_fase13_funciones_y_triggers.sql |

## public.inventory_lots

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| inventory_entry_id | uuid | Sí | — |  |  |
| inventory_item_id | uuid | Sí | — |  |  |
| initial_quantity | numeric(12,3) | Sí | — |  |  |
| remaining_quantity | numeric(12,3) | Sí | — |  |  |
| received_at | timestamp with time zone | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| inventory_lots_initial_quantity_check | c | CHECK (initial_quantity > 0::numeric) | Sí |
| inventory_lots_remaining_quantity_check | c | CHECK (remaining_quantity >= 0::numeric) | Sí |
| inventory_lots_quantity_valid | c | CHECK (remaining_quantity <= initial_quantity) | Sí |
| inventory_lots_pkey | p | PRIMARY KEY (id) | Sí |
| inventory_lots_inventory_entry_id_fkey | f | FOREIGN KEY (inventory_entry_id) REFERENCES inventory_entries(id) ON DELETE RESTRICT | Sí |
| inventory_lots_inventory_item_id_fkey | f | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| inventory_lots_pkey | CREATE UNIQUE INDEX inventory_lots_pkey ON public.inventory_lots USING btree (id) |
| idx_inventory_lots_fifo | CREATE INDEX idx_inventory_lots_fifo ON public.inventory_lots USING btree (inventory_item_id, received_at, created_at) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| inventory_lots_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 005_fase3_inventario_tablas.sql |

## public.inventory_movements

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| inventory_item_id | uuid | Sí | — |  |  |
| lot_id | uuid | No | — |  |  |
| movement_type | text | Sí | — |  |  |
| quantity | numeric(12,3) | Sí | — |  |  |
| reference_type | text | No | — |  |  |
| reference_id | uuid | No | — |  |  |
| reason | text | No | — |  |  |
| created_by | uuid | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| inventory_movements_movement_type_check | c | CHECK (movement_type = ANY (ARRAY['entrada'::text, 'salida'::text, 'merma'::text, 'ajuste'::text, 'devolucion'::text, 'reversion'::text])) | Sí |
| inventory_movements_quantity_check | c | CHECK (quantity > 0::numeric) | Sí |
| inventory_movements_pkey | p | PRIMARY KEY (id) | Sí |
| inventory_movements_inventory_item_id_fkey | f | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT | Sí |
| inventory_movements_lot_id_fkey | f | FOREIGN KEY (lot_id) REFERENCES inventory_lots(id) ON DELETE RESTRICT | Sí |
| inventory_movements_created_by_fkey | f | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| inventory_movements_pkey | CREATE UNIQUE INDEX inventory_movements_pkey ON public.inventory_movements USING btree (id) |
| idx_inventory_movements_item | CREATE INDEX idx_inventory_movements_item ON public.inventory_movements USING btree (inventory_item_id, created_at) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| inventory_movements_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 005_fase3_inventario_tablas.sql |

## public.inventory_reservations

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| order_id | uuid | Sí | — |  |  |
| inventory_item_id | uuid | Sí | — |  |  |
| quantity | numeric(12,3) | Sí | — |  |  |
| status | text | Sí | 'reserved'::text |  |  |
| expires_at | timestamp with time zone | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| released_at | timestamp with time zone | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| inventory_reservations_quantity_check | c | CHECK (quantity > 0::numeric) | Sí |
| inventory_reservations_status_check | c | CHECK (status = ANY (ARRAY['reserved'::text, 'consumed'::text, 'released'::text, 'cancelled'::text])) | Sí |
| inventory_reservations_pkey | p | PRIMARY KEY (id) | Sí |
| inventory_reservations_order_id_fkey | f | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE | Sí |
| inventory_reservations_inventory_item_id_fkey | f | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| inventory_reservations_pkey | CREATE UNIQUE INDEX inventory_reservations_pkey ON public.inventory_reservations USING btree (id) |
| idx_reservations_item_status | CREATE INDEX idx_reservations_item_status ON public.inventory_reservations USING btree (inventory_item_id, status, expires_at) |
| idx_reservations_order | CREATE INDEX idx_reservations_order ON public.inventory_reservations USING btree (order_id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| reservations_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 009_fase5_pedidos_tablas.sql |

## public.inventory_waste

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| inventory_item_id | uuid | Sí | — |  |  |
| lot_id | uuid | No | — |  |  |
| quantity | numeric(12,3) | Sí | — |  |  |
| reason | text | Sí | — |  |  |
| created_by | uuid | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| inventory_waste_quantity_check | c | CHECK (quantity > 0::numeric) | Sí |
| inventory_waste_pkey | p | PRIMARY KEY (id) | Sí |
| inventory_waste_inventory_item_id_fkey | f | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT | Sí |
| inventory_waste_lot_id_fkey | f | FOREIGN KEY (lot_id) REFERENCES inventory_lots(id) ON DELETE RESTRICT | Sí |
| inventory_waste_created_by_fkey | f | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| inventory_waste_pkey | CREATE UNIQUE INDEX inventory_waste_pkey ON public.inventory_waste USING btree (id) |
| idx_inventory_waste_item | CREATE INDEX idx_inventory_waste_item ON public.inventory_waste USING btree (inventory_item_id, created_at) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| inventory_waste_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 005_fase3_inventario_tablas.sql |
| inventory_waste_staff_insert | authenticated | INSERT | PERMISSIVE | — | is_employee_or_admin() | 005_fase3_inventario_tablas.sql |

### Triggers

| Trigger | Enabled | Definición | Fuente local |
| --- | --- | --- | --- |
| trg_inventory_waste_created | O | CREATE TRIGGER trg_inventory_waste_created AFTER INSERT ON inventory_waste FOR EACH ROW EXECUTE FUNCTION handle_inventory_waste() | 006_fase3_inventario_triggers.sql |

## public.notifications

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| type | text | Sí | — |  |  |
| message | text | Sí | — |  |  |
| reference_type | text | No | — |  |  |
| reference_id | uuid | No | — |  |  |
| is_read | boolean | Sí | false |  |  |
| read_by | uuid | No | — |  |  |
| read_at | timestamp with time zone | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| notifications_type_check | c | CHECK (type = ANY (ARRAY['nuevo_pedido'::text, 'pago_pendiente'::text, 'stock_bajo'::text, 'stock_agotado'::text, 'pedido_listo'::text, 'cumpleanos'::text, 'alerta'::text])) | Sí |
| notifications_pkey | p | PRIMARY KEY (id) | Sí |
| notifications_read_by_fkey | f | FOREIGN KEY (read_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| notifications_pkey | CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id) |
| idx_notifications_unread | CREATE INDEX idx_notifications_unread ON public.notifications USING btree (is_read, created_at DESC) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| notifications_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 027_fase13_tablas.sql |
| notifications_staff_update | authenticated | UPDATE | PERMISSIVE | is_employee_or_admin() | is_employee_or_admin() | 027_fase13_tablas.sql |

## public.order_deletion_requests

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| order_id | uuid | Sí | — |  |  |
| requested_by | uuid | Sí | — |  |  |
| reason | text | Sí | — |  |  |
| status | text | Sí | 'pendiente'::text |  |  |
| reviewed_by | uuid | No | — |  |  |
| reviewed_at | timestamp with time zone | No | — |  |  |
| review_reason | text | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| order_deletion_requests_status_check | c | CHECK (status = ANY (ARRAY['pendiente'::text, 'aprobada'::text, 'rechazada'::text])) | Sí |
| deletion_request_review_data_valid | c | CHECK (status = 'pendiente'::text AND reviewed_by IS NULL AND reviewed_at IS NULL OR status <> 'pendiente'::text AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL) | Sí |
| order_deletion_requests_pkey | p | PRIMARY KEY (id) | Sí |
| order_deletion_requests_order_id_fkey | f | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT | Sí |
| order_deletion_requests_requested_by_fkey | f | FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |
| order_deletion_requests_reviewed_by_fkey | f | FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| order_deletion_requests_pkey | CREATE UNIQUE INDEX order_deletion_requests_pkey ON public.order_deletion_requests USING btree (id) |
| idx_deletion_requests_order | CREATE INDEX idx_deletion_requests_order ON public.order_deletion_requests USING btree (order_id) |
| idx_deletion_requests_status | CREATE INDEX idx_deletion_requests_status ON public.order_deletion_requests USING btree (status) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| deletion_requests_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 018_fase9_tablas.sql |

## public.order_discounts

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| order_id | uuid | Sí | — |  |  |
| promotion_id | uuid | No | — |  |  |
| discount_type | text | Sí | — |  |  |
| discount_value | numeric(12,2) | Sí | — |  |  |
| amount_applied | numeric(12,2) | Sí | — |  |  |
| reason | text | No | — |  |  |
| created_by | uuid | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| order_discounts_discount_value_check | c | CHECK (discount_value >= 0::numeric) | Sí |
| order_discounts_amount_applied_check | c | CHECK (amount_applied >= 0::numeric) | Sí |
| order_discounts_manual_reason_required | c | CHECK (discount_type <> 'manual'::text OR reason IS NOT NULL AND TRIM(BOTH FROM reason) <> ''::text) | Sí |
| order_discounts_pkey | p | PRIMARY KEY (id) | Sí |
| order_discounts_order_id_fkey | f | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE | Sí |
| order_discounts_promotion_id_fkey | f | FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL | Sí |
| order_discounts_created_by_fkey | f | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |
| order_discounts_discount_type_check | c | CHECK (discount_type = ANY (ARRAY['porcentaje'::text, 'monto_fijo'::text, 'manual'::text, 'combo'::text])) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| order_discounts_pkey | CREATE UNIQUE INDEX order_discounts_pkey ON public.order_discounts USING btree (id) |
| idx_order_discounts_order | CREATE INDEX idx_order_discounts_order ON public.order_discounts USING btree (order_id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| order_discounts_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 024_fase11_clientes_promociones_tablas.sql |

## public.order_items

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| order_id | uuid | Sí | — |  |  |
| product_id | uuid | No | — |  |  |
| product_name_snapshot | text | Sí | — |  |  |
| unit_price_snapshot | numeric(12,2) | Sí | — |  |  |
| quantity | numeric(12,3) | Sí | — |  |  |
| line_total | numeric(12,2) | Sí | — |  |  |
| personalization | jsonb | No | — |  |  |
| message | text | No | — |  |  |
| note | text | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| order_items_unit_price_snapshot_check | c | CHECK (unit_price_snapshot >= 0::numeric) | Sí |
| order_items_quantity_check | c | CHECK (quantity > 0::numeric) | Sí |
| order_items_line_total_check | c | CHECK (line_total >= 0::numeric) | Sí |
| order_items_pkey | p | PRIMARY KEY (id) | Sí |
| order_items_order_id_fkey | f | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE | Sí |
| order_items_product_id_fkey | f | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| order_items_pkey | CREATE UNIQUE INDEX order_items_pkey ON public.order_items USING btree (id) |
| idx_order_items_order | CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| order_items_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 009_fase5_pedidos_tablas.sql |

## public.orders

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| order_number | bigint | Sí | nextval('order_number_seq'::regclass) |  |  |
| customer_id | uuid | No | — |  |  |
| order_type | text | Sí | 'online'::text |  |  |
| status | text | Sí | 'pendiente_pago'::text |  |  |
| subtotal | numeric(12,2) | Sí | 0 |  |  |
| discount_total | numeric(12,2) | Sí | 0 |  |  |
| total | numeric(12,2) | Sí | 0 |  |  |
| customer_message | text | No | — |  |  |
| internal_note | text | No | — |  |  |
| idempotency_key | text | No | — |  |  |
| reserved_until | timestamp with time zone | No | — |  |  |
| cancelled_at | timestamp with time zone | No | — |  |  |
| cancelled_by | uuid | No | — |  |  |
| cancellation_reason | text | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |
| deleted_at | timestamp with time zone | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| orders_order_type_check | c | CHECK (order_type = ANY (ARRAY['online'::text, 'fisica'::text])) | Sí |
| orders_status_check | c | CHECK (status = ANY (ARRAY['pendiente_pago'::text, 'confirmado'::text, 'en_preparacion'::text, 'listo'::text, 'finalizado'::text, 'cancelado'::text, 'rechazado'::text])) | Sí |
| orders_subtotal_check | c | CHECK (subtotal >= 0::numeric) | Sí |
| orders_discount_total_check | c | CHECK (discount_total >= 0::numeric) | Sí |
| orders_total_check | c | CHECK (total >= 0::numeric) | Sí |
| orders_cancel_reason_required | c | CHECK (status <> 'cancelado'::text OR cancellation_reason IS NOT NULL) | Sí |
| orders_pkey | p | PRIMARY KEY (id) | Sí |
| orders_number_unique | u | UNIQUE (order_number) | Sí |
| orders_idempotency_unique | u | UNIQUE (idempotency_key) | Sí |
| orders_customer_id_fkey | f | FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL | Sí |
| orders_cancelled_by_fkey | f | FOREIGN KEY (cancelled_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| orders_pkey | CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id) |
| orders_number_unique | CREATE UNIQUE INDEX orders_number_unique ON public.orders USING btree (order_number) |
| orders_idempotency_unique | CREATE UNIQUE INDEX orders_idempotency_unique ON public.orders USING btree (idempotency_key) |
| idx_orders_status | CREATE INDEX idx_orders_status ON public.orders USING btree (status, created_at) |
| idx_orders_customer | CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| orders_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 009_fase5_pedidos_tablas.sql |

### Triggers

| Trigger | Enabled | Definición | Fuente local |
| --- | --- | --- | --- |
| trg_notify_new_order | O | CREATE TRIGGER trg_notify_new_order AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION notify_new_order() | 028_fase13_funciones_y_triggers.sql |
| trg_notify_order_ready | O | CREATE TRIGGER trg_notify_order_ready AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION notify_order_ready() | 028_fase13_funciones_y_triggers.sql |

## public.payment_qr_config

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| qr_storage_path | text | No | — |  |  |
| qr_public_url | text | No | — |  |  |
| account_label | text | No | — |  |  |
| is_active | boolean | Sí | true |  |  |
| updated_by | uuid | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| payment_qr_config_pkey | p | PRIMARY KEY (id) | Sí |
| payment_qr_config_updated_by_fkey | f | FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| payment_qr_config_pkey | CREATE UNIQUE INDEX payment_qr_config_pkey ON public.payment_qr_config USING btree (id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| qr_config_public_select | anon, authenticated | SELECT | PERMISSIVE | (is_active = true) | — | 012_fase6_pagos_qr_tablas.sql |

## public.payments

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| order_id | uuid | Sí | — |  |  |
| method | text | Sí | 'qr'::text |  |  |
| amount | numeric(12,2) | Sí | — |  |  |
| status | text | Sí | 'pendiente'::text |  |  |
| reference | text | No | — |  |  |
| rejection_reason | text | No | — |  |  |
| confirmed_by | uuid | No | — |  |  |
| confirmed_at | timestamp with time zone | No | — |  |  |
| rejected_by | uuid | No | — |  |  |
| rejected_at | timestamp with time zone | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| payments_method_check | c | CHECK (method = ANY (ARRAY['qr'::text, 'efectivo'::text, 'otro'::text])) | Sí |
| payments_amount_check | c | CHECK (amount > 0::numeric) | Sí |
| payments_status_check | c | CHECK (status = ANY (ARRAY['pendiente'::text, 'confirmado'::text, 'rechazado'::text, 'reembolsado'::text])) | Sí |
| payments_confirmation_data_valid | c | CHECK (status = 'confirmado'::text AND confirmed_by IS NOT NULL AND confirmed_at IS NOT NULL OR status <> 'confirmado'::text) | Sí |
| payments_rejection_data_valid | c | CHECK (status = 'rechazado'::text AND rejection_reason IS NOT NULL AND rejected_by IS NOT NULL AND rejected_at IS NOT NULL OR status <> 'rechazado'::text) | Sí |
| payments_pkey | p | PRIMARY KEY (id) | Sí |
| payments_order_id_fkey | f | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT | Sí |
| payments_confirmed_by_fkey | f | FOREIGN KEY (confirmed_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |
| payments_rejected_by_fkey | f | FOREIGN KEY (rejected_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| payments_pkey | CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id) |
| idx_payments_order | CREATE INDEX idx_payments_order ON public.payments USING btree (order_id, created_at DESC) |
| idx_payments_status | CREATE INDEX idx_payments_status ON public.payments USING btree (status) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| payments_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 012_fase6_pagos_qr_tablas.sql |

### Triggers

| Trigger | Enabled | Definición | Fuente local |
| --- | --- | --- | --- |
| trg_notify_pending_payment | O | CREATE TRIGGER trg_notify_pending_payment AFTER INSERT ON payments FOR EACH ROW EXECUTE FUNCTION notify_pending_payment() | 028_fase13_funciones_y_triggers.sql |

## public.product_components

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| parent_product_id | uuid | Sí | — |  |  |
| component_product_id | uuid | Sí | — |  |  |
| quantity | numeric(12,3) | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| product_components_quantity_check | c | CHECK (quantity > 0::numeric) | Sí |
| product_components_not_self | c | CHECK (parent_product_id <> component_product_id) | Sí |
| product_components_pkey | p | PRIMARY KEY (id) | Sí |
| product_components_unique | u | UNIQUE (parent_product_id, component_product_id) | Sí |
| product_components_parent_product_id_fkey | f | FOREIGN KEY (parent_product_id) REFERENCES products(id) ON DELETE CASCADE | Sí |
| product_components_component_product_id_fkey | f | FOREIGN KEY (component_product_id) REFERENCES products(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| product_components_pkey | CREATE UNIQUE INDEX product_components_pkey ON public.product_components USING btree (id) |
| product_components_unique | CREATE UNIQUE INDEX product_components_unique ON public.product_components USING btree (parent_product_id, component_product_id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| product_components_admin_insert | authenticated | INSERT | PERMISSIVE | — | is_admin() | Fuera del estado local final |
| product_components_admin_select | authenticated | SELECT | PERMISSIVE | is_admin() | — | Fuera del estado local final |
| product_components_admin_update | authenticated | UPDATE | PERMISSIVE | is_admin() | is_admin() | Fuera del estado local final |
| product_components_admin_delete | authenticated | DELETE | PERMISSIVE | is_admin() | — | Fuera del estado local final |
| product_components_employee_admin_all | authenticated | ALL | PERMISSIVE | is_employee_or_admin() | is_employee_or_admin() | 002_correccion_rls_catalogo_empleado.sql |
| product_components_public_select | anon, authenticated | SELECT | PERMISSIVE | (EXISTS ( SELECT 1    FROM products p   WHERE ((p.id = product_components.parent_product_id) AND (p.is_active = true)))) | — | 018_catalogo_publico_rls.sql |

## public.product_images

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| product_id | uuid | Sí | — |  |  |
| storage_path | text | Sí | — |  |  |
| public_url | text | No | — |  |  |
| alt_text | text | No | — |  |  |
| sort_order | integer | Sí | 0 |  |  |
| mime_type | text | No | — |  |  |
| width | integer | No | — |  |  |
| height | integer | No | — |  |  |
| file_size_bytes | bigint | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| product_images_pkey | p | PRIMARY KEY (id) | Sí |
| product_images_product_id_fkey | f | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| product_images_pkey | CREATE UNIQUE INDEX product_images_pkey ON public.product_images USING btree (id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| product_images_admin_insert | authenticated | INSERT | PERMISSIVE | — | is_admin() | Fuera del estado local final |
| product_images_admin_select | authenticated | SELECT | PERMISSIVE | is_admin() | — | Fuera del estado local final |
| product_images_admin_update | authenticated | UPDATE | PERMISSIVE | is_admin() | is_admin() | Fuera del estado local final |
| product_images_admin_delete | authenticated | DELETE | PERMISSIVE | is_admin() | — | Fuera del estado local final |
| product_images_employee_admin_all | authenticated | ALL | PERMISSIVE | is_employee_or_admin() | is_employee_or_admin() | 002_correccion_rls_catalogo_empleado.sql |
| product_images_public_select | anon, authenticated | SELECT | PERMISSIVE | (EXISTS ( SELECT 1    FROM products p   WHERE ((p.id = product_images.product_id) AND (p.is_active = true)))) | — | 018_catalogo_publico_rls.sql |

## public.product_inventory_requirements

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| product_id | uuid | Sí | — |  |  |
| inventory_item_id | uuid | Sí | — |  |  |
| quantity | numeric(12,3) | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| product_inventory_requirements_quantity_check | c | CHECK (quantity > 0::numeric) | Sí |
| product_inventory_requirements_pkey | p | PRIMARY KEY (id) | Sí |
| product_inventory_requirements_unique | u | UNIQUE (product_id, inventory_item_id) | Sí |
| product_inventory_requirements_product_id_fkey | f | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE | Sí |
| product_inventory_requirements_inventory_item_id_fkey | f | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| product_inventory_requirements_pkey | CREATE UNIQUE INDEX product_inventory_requirements_pkey ON public.product_inventory_requirements USING btree (id) |
| product_inventory_requirements_unique | CREATE UNIQUE INDEX product_inventory_requirements_unique ON public.product_inventory_requirements USING btree (product_id, inventory_item_id) |
| idx_pir_product | CREATE INDEX idx_pir_product ON public.product_inventory_requirements USING btree (product_id) |
| idx_pir_item | CREATE INDEX idx_pir_item ON public.product_inventory_requirements USING btree (inventory_item_id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| pir_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 007_fase4_arreglos_tablas.sql |
| pir_staff_insert | authenticated | INSERT | PERMISSIVE | — | is_employee_or_admin() | 007_fase4_arreglos_tablas.sql |
| pir_staff_update | authenticated | UPDATE | PERMISSIVE | is_employee_or_admin() | is_employee_or_admin() | 007_fase4_arreglos_tablas.sql |
| pir_staff_delete | authenticated | DELETE | PERMISSIVE | is_employee_or_admin() | — | 007_fase4_arreglos_tablas.sql |

## public.products

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| name | text | Sí | — |  |  |
| description | text | No | — |  |  |
| price | numeric(12,2) | Sí | — |  |  |
| category_id | uuid | No | — |  |  |
| occasion | text | No | — |  |  |
| season_id | uuid | No | — |  |  |
| is_featured | boolean | Sí | false |  |  |
| is_available | boolean | Sí | true |  |  |
| is_sold_out | boolean | Sí | false |  |  |
| catalog_order | integer | Sí | 0 |  |  |
| is_active | boolean | Sí | true |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| products_price_check | c | CHECK (price >= 0::numeric) | Sí |
| products_pkey | p | PRIMARY KEY (id) | Sí |
| products_category_id_fkey | f | FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL | Sí |
| products_season_id_fkey | f | FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| products_pkey | CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| products_admin_insert | authenticated | INSERT | PERMISSIVE | — | is_admin() | Fuera del estado local final |
| products_admin_update | authenticated | UPDATE | PERMISSIVE | is_admin() | is_admin() | Fuera del estado local final |
| products_admin_select | authenticated | SELECT | PERMISSIVE | is_admin() | — | Fuera del estado local final |
| products_employee_admin_all | authenticated | ALL | PERMISSIVE | is_employee_or_admin() | is_employee_or_admin() | 002_correccion_rls_catalogo_empleado.sql |
| products_public_select | anon, authenticated | SELECT | PERMISSIVE | (is_active = true) | — | 018_catalogo_publico_rls.sql |

### Triggers

| Trigger | Enabled | Definición | Fuente local |
| --- | --- | --- | --- |
| trg_audit_products | O | CREATE TRIGGER trg_audit_products AFTER UPDATE ON products FOR EACH ROW WHEN (old.name IS DISTINCT FROM new.name OR old.description IS DISTINCT FROM new.description OR old.price IS DISTINCT FROM new.price OR old.category_id IS DISTINCT FROM new.category_id OR old.occasion IS DISTINCT FROM new.occasion OR old.season_id IS DISTINCT FROM new.season_id OR old.is_featured IS DISTINCT FROM new.is_featured OR old.is_available IS DISTINCT FROM new.is_available OR old.is_sold_out IS DISTINCT FROM new.is_sold_out OR old.catalog_order IS DISTINCT FROM new.catalog_order OR old.is_active IS DISTINCT FROM new.is_active) EXECUTE FUNCTION audit_products_change() | 030_fase14_auditoria.sql |

## public.profiles

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | — |  |  |
| full_name | text | No | — |  |  |
| role | text | Sí | 'empleado'::text |  |  |
| is_active | boolean | Sí | true |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| profiles_role_check | c | CHECK (role = ANY (ARRAY['administrador'::text, 'empleado'::text])) | Sí |
| profiles_pkey | p | PRIMARY KEY (id) | Sí |
| profiles_id_fkey | f | FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| profiles_pkey | CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| Usuarios pueden ver su propio perfil | authenticated | SELECT | PERMISSIVE | (auth.uid() = id) | — | Fuera del estado local final |
| Administradores pueden ver todos los perfiles | authenticated | SELECT | PERMISSIVE | is_admin() | — | Fuera del estado local final |
| profiles_select_own | authenticated | SELECT | PERMISSIVE | (id = auth.uid()) | — | 004_correccion_rls_profiles.sql |
| profiles_select_admin_all | authenticated | SELECT | PERMISSIVE | is_admin() | — | 004_correccion_rls_profiles.sql |
| profiles_update_admin | authenticated | UPDATE | PERMISSIVE | is_admin() | is_admin() | 004_correccion_rls_profiles.sql |

## public.promotion_products

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| promotion_id | uuid | Sí | — |  |  |
| product_id | uuid | Sí | — |  |  |
| quantity | numeric(12,3) | Sí | 1 |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| promotion_products_pkey | p | PRIMARY KEY (promotion_id, product_id) | Sí |
| promotion_products_promotion_id_fkey | f | FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE | Sí |
| promotion_products_product_id_fkey | f | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE | Sí |
| promotion_products_quantity_check | c | CHECK (quantity > 0::numeric) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| promotion_products_pkey | CREATE UNIQUE INDEX promotion_products_pkey ON public.promotion_products USING btree (promotion_id, product_id) |
| idx_promotion_products_product | CREATE INDEX idx_promotion_products_product ON public.promotion_products USING btree (product_id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| promotion_products_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 024_fase11_clientes_promociones_tablas.sql |
| promotion_products_admin_insert | authenticated | INSERT | PERMISSIVE | — | is_admin() | 024_fase11_clientes_promociones_tablas.sql |
| promotion_products_admin_delete | authenticated | DELETE | PERMISSIVE | is_admin() | — | 024_fase11_clientes_promociones_tablas.sql |
| promotion_products_admin_update | authenticated | UPDATE | PERMISSIVE | is_admin() | is_admin() | 033_reparacion_promociones.sql |

## public.promotions

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| name | text | Sí | — |  |  |
| description | text | No | — |  |  |
| promotion_type | text | Sí | — |  |  |
| discount_type | text | No | — |  |  |
| discount_value | numeric(12,2) | No | — |  |  |
| starts_at | timestamp with time zone | No | — |  |  |
| ends_at | timestamp with time zone | No | — |  |  |
| minimum_purchase | numeric(12,2) | No | — |  |  |
| is_active | boolean | Sí | true |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |
| combo_price | numeric(12,2) | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| promotions_discount_type_check | c | CHECK (discount_type = ANY (ARRAY['porcentaje'::text, 'monto_fijo'::text])) | Sí |
| promotions_discount_value_check | c | CHECK (discount_value >= 0::numeric) | Sí |
| promotions_minimum_purchase_check | c | CHECK (minimum_purchase >= 0::numeric) | Sí |
| promotions_pkey | p | PRIMARY KEY (id) | Sí |
| promotions_type_fields_check | c | CHECK (promotion_type = 'producto'::text AND discount_type IS NOT NULL AND discount_value IS NOT NULL AND combo_price IS NULL OR promotion_type = 'combo'::text AND combo_price IS NOT NULL AND discount_type IS NULL AND discount_value IS NULL) | Sí |
| promotions_promotion_type_check | c | CHECK (promotion_type = ANY (ARRAY['producto'::text, 'combo'::text])) | Sí |
| promotions_combo_price_check | c | CHECK (combo_price IS NULL OR combo_price >= 0::numeric) | Sí |
| promotions_percent_max_check | c | CHECK (discount_type IS DISTINCT FROM 'porcentaje'::text OR discount_value <= 100::numeric) NOT VALID | No |
| promotions_dates_check | c | CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at) NOT VALID | No |

### Índices

| Índice | Definición |
| --- | --- |
| promotions_pkey | CREATE UNIQUE INDEX promotions_pkey ON public.promotions USING btree (id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| promotions_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 024_fase11_clientes_promociones_tablas.sql |
| promotions_admin_insert | authenticated | INSERT | PERMISSIVE | — | is_admin() | 024_fase11_clientes_promociones_tablas.sql |
| promotions_admin_update | authenticated | UPDATE | PERMISSIVE | is_admin() | is_admin() | 024_fase11_clientes_promociones_tablas.sql |
| promotions_public_select_active | anon | SELECT | PERMISSIVE | (is_active = true) | — | 024_fase11_clientes_promociones_tablas.sql |

## public.rate_limit_attempts

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | bigint | Sí | — | a |  |
| ip | text | Sí | — |  |  |
| route | text | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| rate_limit_attempts_pkey | p | PRIMARY KEY (id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| rate_limit_attempts_pkey | CREATE UNIQUE INDEX rate_limit_attempts_pkey ON public.rate_limit_attempts USING btree (id) |
| idx_rate_limit_attempts_ip_route_time | CREATE INDEX idx_rate_limit_attempts_ip_route_time ON public.rate_limit_attempts USING btree (ip, route, created_at DESC) |

## public.sale_returns

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| order_id | uuid | Sí | — |  |  |
| type | text | Sí | — |  |  |
| amount | numeric(12,2) | Sí | — |  |  |
| reason | text | Sí | — |  |  |
| created_by | uuid | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| sale_returns_type_check | c | CHECK (type = ANY (ARRAY['devolucion'::text, 'reintegro'::text])) | Sí |
| sale_returns_amount_check | c | CHECK (amount > 0::numeric) | Sí |
| sale_returns_pkey | p | PRIMARY KEY (id) | Sí |
| sale_returns_order_id_fkey | f | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT | Sí |
| sale_returns_created_by_fkey | f | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| sale_returns_pkey | CREATE UNIQUE INDEX sale_returns_pkey ON public.sale_returns USING btree (id) |
| idx_sale_returns_order | CREATE INDEX idx_sale_returns_order ON public.sale_returns USING btree (order_id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| sale_returns_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 018_fase9_tablas.sql |

## public.seasons

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| name | text | Sí | — |  |  |
| description | text | No | — |  |  |
| starts_at | timestamp with time zone | No | — |  |  |
| ends_at | timestamp with time zone | No | — |  |  |
| is_active | boolean | Sí | true |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| seasons_pkey | p | PRIMARY KEY (id) | Sí |
| seasons_name_unique | u | UNIQUE (name) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| seasons_pkey | CREATE UNIQUE INDEX seasons_pkey ON public.seasons USING btree (id) |
| seasons_name_unique | CREATE UNIQUE INDEX seasons_name_unique ON public.seasons USING btree (name) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| seasons_admin_insert | authenticated | INSERT | PERMISSIVE | — | is_admin() | Fuera del estado local final |
| seasons_admin_update | authenticated | UPDATE | PERMISSIVE | is_admin() | is_admin() | Fuera del estado local final |
| seasons_admin_select | authenticated | SELECT | PERMISSIVE | is_admin() | — | Fuera del estado local final |
| seasons_employee_admin_all | authenticated | ALL | PERMISSIVE | is_employee_or_admin() | is_employee_or_admin() | 002_correccion_rls_catalogo_empleado.sql |
| seasons_public_select | anon, authenticated | SELECT | PERMISSIVE | (is_active = true) | — | 018_catalogo_publico_rls.sql |

## public.system_settings

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| key | text | Sí | — |  |  |
| value | jsonb | Sí | — |  |  |
| is_critical | boolean | Sí | false |  |  |
| updated_by | uuid | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| system_settings_pkey | p | PRIMARY KEY (key) | Sí |
| system_settings_updated_by_fkey | f | FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| system_settings_pkey | CREATE UNIQUE INDEX system_settings_pkey ON public.system_settings USING btree (key) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| Administradores pueden ver configuración | authenticated | SELECT | PERMISSIVE | is_admin() | — | Fuera del estado local final |
| Administradores pueden modificar configuración | authenticated | UPDATE | PERMISSIVE | is_admin() | is_admin() | Fuera del estado local final |
| system_settings_staff_select | authenticated | SELECT | PERMISSIVE | is_employee_or_admin() | — | 027_fase13_tablas.sql |

## public.whatsapp_config

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| phone_number | text | Sí | — |  |  |
| is_active | boolean | Sí | true |  |  |
| updated_by | uuid | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| whatsapp_config_pkey | p | PRIMARY KEY (id) | Sí |
| whatsapp_config_updated_by_fkey | f | FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| whatsapp_config_pkey | CREATE UNIQUE INDEX whatsapp_config_pkey ON public.whatsapp_config USING btree (id) |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| whatsapp_config_public_select | anon, authenticated | SELECT | PERMISSIVE | (is_active = true) | — | 015_fase7_whatsapp_config.sql |

## realtime.messages

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| topic | text | Sí | — |  |  |
| extension | text | Sí | — |  |  |
| payload | jsonb | No | — |  |  |
| event | text | No | — |  |  |
| private | boolean | No | false |  |  |
| updated_at | timestamp without time zone | Sí | now() |  |  |
| inserted_at | timestamp without time zone | Sí | now() |  |  |
| id | uuid | Sí | gen_random_uuid() |  |  |
| binary_payload | bytea | No | — |  |  |
| skip_broadcast | boolean | Sí | false |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| messages_payload_exclusive | c | CHECK (payload IS NULL OR binary_payload IS NULL) NOT VALID | No |
| messages_pkey | p | PRIMARY KEY (id, inserted_at) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| messages_pkey | CREATE UNIQUE INDEX messages_pkey ON ONLY realtime.messages USING btree (id, inserted_at) |
| messages_inserted_at_topic_index | CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE)) |

## realtime.schema_migrations

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| version | bigint | Sí | — |  |  |
| inserted_at | timestamp(0) without time zone | No | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| schema_migrations_pkey | p | PRIMARY KEY (version) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| schema_migrations_pkey | CREATE UNIQUE INDEX schema_migrations_pkey ON realtime.schema_migrations USING btree (version) |

## realtime.subscription

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | bigint | Sí | — | a |  |
| subscription_id | uuid | Sí | — |  |  |
| entity | regclass | Sí | — |  |  |
| filters | realtime.user_defined_filter[] | Sí | '{}'::realtime.user_defined_filter[] |  |  |
| claims | jsonb | Sí | — |  |  |
| claims_role | regrole | Sí | realtime.to_regrole((claims ->> 'role'::text)) |  | s |
| created_at | timestamp without time zone | Sí | timezone('utc'::text, now()) |  |  |
| action_filter | text | No | '*'::text |  |  |
| selected_columns | text[] | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| subscription_action_filter_check | c | CHECK (action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])) | Sí |
| pk_subscription | p | PRIMARY KEY (id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| pk_subscription | CREATE UNIQUE INDEX pk_subscription ON realtime.subscription USING btree (id) |
| ix_realtime_subscription_entity | CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity) |
| subscription_subscription_id_entity_filters_action_filter_selec | CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[])) |

### Triggers

| Trigger | Enabled | Definición | Fuente local |
| --- | --- | --- | --- |
| tr_check_filters | O | CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters() | Fuera de migrations |

## storage.buckets

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | text | Sí | — |  |  |
| name | text | Sí | — |  |  |
| owner | uuid | No | — |  |  |
| created_at | timestamp with time zone | No | now() |  |  |
| updated_at | timestamp with time zone | No | now() |  |  |
| public | boolean | No | false |  |  |
| avif_autodetection | boolean | No | false |  |  |
| file_size_limit | bigint | No | — |  |  |
| allowed_mime_types | text[] | No | — |  |  |
| owner_id | text | No | — |  |  |
| type | storage.buckettype | Sí | 'STANDARD'::storage.buckettype |  |  |
| versioning_status | text | Sí | 'DISABLED'::text |  |  |
| lifecycle_configuration | jsonb | No | — |  |  |
| lifecycle_configuration_generation | uuid | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| buckets_pkey | p | PRIMARY KEY (id) | Sí |
| buckets_versioning_status_check | c | CHECK (versioning_status = ANY (ARRAY['DISABLED'::text, 'ENABLED'::text, 'SUSPENDED'::text])) | Sí |
| buckets_versioning_standard_only_check | c | CHECK (type = 'STANDARD'::storage.buckettype OR versioning_status = 'DISABLED'::text) | Sí |
| buckets_versioning_dark_check | c | CHECK (versioning_status = 'DISABLED'::text) | Sí |
| buckets_lifecycle_configuration_pair_check | c | CHECK ((lifecycle_configuration IS NULL) = (lifecycle_configuration_generation IS NULL)) | Sí |
| buckets_lifecycle_configuration_shape_check | c | CHECK (lifecycle_configuration IS NULL OR jsonb_typeof(lifecycle_configuration) = 'object'::text AND lifecycle_configuration ? 'rules'::text AND CASE     WHEN jsonb_typeof(lifecycle_configuration -> 'rules'::text) = 'array'::text THEN jsonb_array_length(lifecycle_configuration -> 'rules'::text) >= 1 AND jsonb_array_length(lifecycle_configuration -> 'rules'::text) <= 1000     ELSE false END) | Sí |
| buckets_lifecycle_configuration_standard_only_check | c | CHECK (type = 'STANDARD'::storage.buckettype OR lifecycle_configuration IS NULL AND lifecycle_configuration_generation IS NULL) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| buckets_pkey | CREATE UNIQUE INDEX buckets_pkey ON storage.buckets USING btree (id) |
| bname | CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name) |

### Triggers

| Trigger | Enabled | Definición | Fuente local |
| --- | --- | --- | --- |
| enforce_bucket_name_length_trigger | O | CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length() | Fuera de migrations |
| protect_buckets_delete | O | CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete() | Fuera de migrations |
| protect_bucket_control_insert | O | CREATE TRIGGER protect_bucket_control_insert BEFORE INSERT ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns('service_role') | Fuera de migrations |
| protect_bucket_control_update | O | CREATE TRIGGER protect_bucket_control_update BEFORE UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns() | Fuera de migrations |
| protect_bucket_control_update_role | O | CREATE TRIGGER protect_bucket_control_update_role AFTER UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_lifecycle_service_role('service_role') | Fuera de migrations |

## storage.buckets_analytics

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| name | text | Sí | — |  |  |
| type | storage.buckettype | Sí | 'ANALYTICS'::storage.buckettype |  |  |
| format | text | Sí | 'ICEBERG'::text |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |
| id | uuid | Sí | gen_random_uuid() |  |  |
| deleted_at | timestamp with time zone | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| buckets_analytics_pkey | p | PRIMARY KEY (id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| buckets_analytics_pkey | CREATE UNIQUE INDEX buckets_analytics_pkey ON storage.buckets_analytics USING btree (id) |
| buckets_analytics_unique_name_idx | CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL) |

## storage.buckets_vectors

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | text | Sí | — |  |  |
| type | storage.buckettype | Sí | 'VECTOR'::storage.buckettype |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| buckets_vectors_pkey | p | PRIMARY KEY (id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| buckets_vectors_pkey | CREATE UNIQUE INDEX buckets_vectors_pkey ON storage.buckets_vectors USING btree (id) |

## storage.migrations

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | integer | Sí | — |  |  |
| name | character varying(100) | Sí | — |  |  |
| hash | character varying(40) | Sí | — |  |  |
| executed_at | timestamp without time zone | No | CURRENT_TIMESTAMP |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| migrations_pkey | p | PRIMARY KEY (id) | Sí |
| migrations_name_key | u | UNIQUE (name) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| migrations_pkey | CREATE UNIQUE INDEX migrations_pkey ON storage.migrations USING btree (id) |
| migrations_name_key | CREATE UNIQUE INDEX migrations_name_key ON storage.migrations USING btree (name) |

## storage.objects

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| bucket_id | text | No | — |  |  |
| name | text | No | — |  |  |
| owner | uuid | No | — |  |  |
| created_at | timestamp with time zone | No | now() |  |  |
| updated_at | timestamp with time zone | No | now() |  |  |
| last_accessed_at | timestamp with time zone | No | now() |  |  |
| metadata | jsonb | No | — |  |  |
| path_tokens | text[] | No | string_to_array(name, '/'::text) |  | s |
| version | text | No | — |  |  |
| owner_id | text | No | — |  |  |
| user_metadata | jsonb | No | — |  |  |
| archived_at | timestamp with time zone | No | — |  |  |
| is_delete_marker | boolean | Sí | false |  |  |
| is_versioned | boolean | Sí | false |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| objects_pkey | p | PRIMARY KEY (id) | Sí |
| objects_bucketId_fkey | f | FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| objects_pkey | CREATE UNIQUE INDEX objects_pkey ON storage.objects USING btree (id) |
| name_prefix_search | CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops) |
| idx_objects_bucket_id_name | CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C") |
| idx_objects_bucket_id_name_lower | CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C") |
| objects_bucket_id_name_version_key | CREATE UNIQUE INDEX objects_bucket_id_name_version_key ON storage.objects USING btree (bucket_id, name COLLATE "C", version) NULLS NOT DISTINCT |
| idx_objects_current_version | CREATE UNIQUE INDEX idx_objects_current_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (archived_at IS NULL) |
| idx_objects_null_version | CREATE UNIQUE INDEX idx_objects_null_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (NOT is_versioned) |
| idx_objects_delete_markers | CREATE INDEX idx_objects_delete_markers ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE is_delete_marker |

### Políticas RLS

| Política | Roles | Comando | Tipo | USING | WITH CHECK | Última migración local |
| --- | --- | --- | --- | --- | --- | --- |
| product_images_employee_admin_insert | authenticated | INSERT | PERMISSIVE | — | ((bucket_id = 'product-images'::text) AND is_employee_or_admin()) | 003_correccion_storage_product_images_empleado.sql |
| product_images_employee_admin_update | authenticated | UPDATE | PERMISSIVE | ((bucket_id = 'product-images'::text) AND is_employee_or_admin()) | ((bucket_id = 'product-images'::text) AND is_employee_or_admin()) | 003_correccion_storage_product_images_empleado.sql |
| product_images_employee_admin_delete | authenticated | DELETE | PERMISSIVE | ((bucket_id = 'product-images'::text) AND is_employee_or_admin()) | — | 003_correccion_storage_product_images_empleado.sql |

### Triggers

| Trigger | Enabled | Definición | Fuente local |
| --- | --- | --- | --- |
| update_objects_updated_at | O | CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column() | Fuera de migrations |
| protect_objects_delete | O | CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete() | Fuera de migrations |

## storage.s3_multipart_uploads

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | text | Sí | — |  |  |
| in_progress_size | bigint | Sí | 0 |  |  |
| upload_signature | text | Sí | — |  |  |
| bucket_id | text | Sí | — |  |  |
| key | text | Sí | — |  |  |
| version | text | Sí | — |  |  |
| owner_id | text | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| user_metadata | jsonb | No | — |  |  |
| metadata | jsonb | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| s3_multipart_uploads_pkey | p | PRIMARY KEY (id) | Sí |
| s3_multipart_uploads_bucket_id_fkey | f | FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| s3_multipart_uploads_pkey | CREATE UNIQUE INDEX s3_multipart_uploads_pkey ON storage.s3_multipart_uploads USING btree (id) |
| idx_multipart_uploads_list | CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at) |

## storage.s3_multipart_uploads_parts

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| upload_id | text | Sí | — |  |  |
| size | bigint | Sí | 0 |  |  |
| part_number | integer | Sí | — |  |  |
| bucket_id | text | Sí | — |  |  |
| key | text | Sí | — |  |  |
| etag | text | Sí | — |  |  |
| owner_id | text | No | — |  |  |
| version | text | Sí | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| s3_multipart_uploads_parts_upload_id_fkey | f | FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE | Sí |
| s3_multipart_uploads_parts_pkey | p | PRIMARY KEY (id) | Sí |
| s3_multipart_uploads_parts_bucket_id_fkey | f | FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| s3_multipart_uploads_parts_pkey | CREATE UNIQUE INDEX s3_multipart_uploads_parts_pkey ON storage.s3_multipart_uploads_parts USING btree (id) |

## storage.vector_indexes

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | text | Sí | gen_random_uuid() |  |  |
| name | text | Sí | — |  |  |
| bucket_id | text | Sí | — |  |  |
| data_type | text | Sí | — |  |  |
| dimension | integer | Sí | — |  |  |
| distance_metric | text | Sí | — |  |  |
| metadata_configuration | jsonb | No | — |  |  |
| created_at | timestamp with time zone | Sí | now() |  |  |
| updated_at | timestamp with time zone | Sí | now() |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| vector_indexes_pkey | p | PRIMARY KEY (id) | Sí |
| vector_indexes_bucket_id_fkey | f | FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| vector_indexes_pkey | CREATE UNIQUE INDEX vector_indexes_pkey ON storage.vector_indexes USING btree (id) |
| vector_indexes_name_bucket_id_idx | CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id) |

## supabase_migrations.schema_migrations

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| version | text | Sí | — |  |  |
| statements | text[] | No | — |  |  |
| name | text | No | — |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| schema_migrations_pkey | p | PRIMARY KEY (version) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| schema_migrations_pkey | CREATE UNIQUE INDEX schema_migrations_pkey ON supabase_migrations.schema_migrations USING btree (version) |

## vault.decrypted_secrets

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | — |  |  |
| name | text | No | — |  |  |
| description | text | No | — |  |  |
| secret | text | No | — |  |  |
| decrypted_secret | text | No | — |  |  |
| key_id | uuid | No | — |  |  |
| nonce | bytea | No | — |  |  |
| created_at | timestamp with time zone | No | — |  |  |
| updated_at | timestamp with time zone | No | — |  |  |

## vault.secrets

| Columna | Tipo | NOT NULL | Default | Identity | Generated |
| --- | --- | --- | --- | --- | --- |
| id | uuid | Sí | gen_random_uuid() |  |  |
| name | text | No | — |  |  |
| description | text | Sí | ''::text |  |  |
| secret | text | Sí | — |  |  |
| key_id | uuid | No | — |  |  |
| nonce | bytea | No | vault._crypto_aead_det_noncegen() |  |  |
| created_at | timestamp with time zone | Sí | CURRENT_TIMESTAMP |  |  |
| updated_at | timestamp with time zone | Sí | CURRENT_TIMESTAMP |  |  |

### PK, FK, UNIQUE, CHECK y exclusiones

| Constraint | Tipo | Definición | Validada |
| --- | --- | --- | --- |
| secrets_pkey | p | PRIMARY KEY (id) | Sí |

### Índices

| Índice | Definición |
| --- | --- |
| secrets_pkey | CREATE UNIQUE INDEX secrets_pkey ON vault.secrets USING btree (id) |
| secrets_name_idx | CREATE UNIQUE INDEX secrets_name_idx ON vault.secrets USING btree (name) WHERE (name IS NOT NULL) |

## Secuencias (parámetros, sin valores operativos)

| Objeto | Tipo | Inicio | Mínimo | Máximo | Incremento | Ciclo |
| --- | --- | --- | --- | --- | --- | --- |
| auth.refresh_tokens_id_seq | bigint | 1 | 1 | 9223372036854775807 | 1 | No |
| realtime.subscription_id_seq | bigint | 1 | 1 | 9223372036854775807 | 1 | No |
| public.order_number_seq | bigint | 1 | 1 | 9223372036854775807 | 1 | No |
| public.rate_limit_attempts_id_seq | bigint | 1 | 1 | 9223372036854775807 | 1 | No |

## Propiedad de secuencias

| Secuencia | Tabla | Columna | Dependencia |
| --- | --- | --- | --- |
| auth.refresh_tokens_id_seq | auth.refresh_tokens | id | a |
| realtime.subscription_id_seq | realtime.subscription | id | i |
| rate_limit_attempts_id_seq | rate_limit_attempts | id | i |

## Funciones y RPC

Las definiciones completas de public están conservadas como metadatos en remote-catalog.json. Las funciones de plataforma se inventarían por firma, sin extraer secretos ni datos. La equivalencia de cuerpos no demuestra equivalencia de permisos.

| Schema.función | Argumentos | Resultado | Lenguaje | SECURITY DEFINER | Volatilidad | Configuración | ACL | Fuente final local |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| extensions.uuid_generate_v1 |  | uuid | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.uuid_generate_v1mc |  | uuid | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.uuid_generate_v3 | namespace uuid, name text | uuid | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.uuid_generate_v4 |  | uuid | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.uuid_generate_v5 | namespace uuid, name text | uuid | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.digest | text, text | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.digest | bytea, text | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| auth.uid |  | uuid | sql | No | s | — | {=X/supabase_auth_admin,supabase_auth_admin=X/supabase_auth_admin,dashboard_user=X/supabase_auth_admin} | Plataforma |
| auth.role |  | text | sql | No | s | — | {=X/supabase_auth_admin,supabase_auth_admin=X/supabase_auth_admin,dashboard_user=X/supabase_auth_admin} | Plataforma |
| auth.email |  | text | sql | No | s | — | {=X/supabase_auth_admin,supabase_auth_admin=X/supabase_auth_admin,dashboard_user=X/supabase_auth_admin} | Plataforma |
| extensions.uuid_nil |  | uuid | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.uuid_ns_dns |  | uuid | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.uuid_ns_url |  | uuid | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.uuid_ns_oid |  | uuid | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.uuid_ns_x500 |  | uuid | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_sym_decrypt_bytea | bytea, text | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_sym_decrypt | bytea, text, text | text | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.encrypt_iv | bytea, bytea, bytea, text | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.decrypt_iv | bytea, bytea, bytea, text | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.gen_random_bytes | integer | bytea | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.gen_random_uuid |  | uuid | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_sym_encrypt | text, text | bytea | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_sym_encrypt_bytea | bytea, text | bytea | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_sym_encrypt | text, text, text | bytea | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_sym_encrypt_bytea | bytea, text, text | bytea | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_sym_decrypt | bytea, text | text | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.hmac | text, text, text | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.hmac | bytea, bytea, text | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_pub_encrypt | text, bytea | bytea | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgrst_drop_watch |  | event_trigger | plpgsql | No | v | search_path="" | {=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X*/supabase_admin} | Plataforma |
| extensions.pgp_pub_decrypt | bytea, bytea, text | text | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_pub_decrypt_bytea | bytea, bytea, text | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_pub_decrypt | bytea, bytea, text, text | text | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_pub_decrypt_bytea | bytea, bytea, text, text | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_key_id | bytea | text | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.armor | bytea | text | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.armor | bytea, text[], text[] | text | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.dearmor | text | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.grant_pg_graphql_access |  | event_trigger | plpgsql | No | v | search_path="" | {=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X*/supabase_admin} | Plataforma |
| extensions.pgp_armor_headers | text, OUT key text, OUT value text | SETOF record | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pg_stat_statements_info | OUT dealloc bigint, OUT stats_reset timestamp with time zone | record | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgrst_ddl_watch |  | event_trigger | plpgsql | No | v | search_path="" | {=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X*/supabase_admin} | Plataforma |
| realtime.cast | val text, type_ regtype | jsonb | plpgsql | No | i | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin,anon=X/supabase_realtime_admin,authenticated=X/supabase_realtime_admin,service_role=X/supabase_realtime_admin} | Plataforma |
| vault._crypto_aead_det_noncegen |  | bytea | c | No | i | — | {supabase_admin=X/supabase_admin} | Plataforma |
| vault._crypto_aead_det_encrypt | message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea | bytea | c | No | i | — | {supabase_admin=X/supabase_admin} | Plataforma |
| vault.create_secret | new_secret text, new_name text DEFAULT NULL::text, new_description text DEFAULT ''::text, new_key_id uuid DEFAULT NULL::uuid | uuid | plpgsql | Sí | v | search_path="" | {supabase_admin=X/supabase_admin,postgres=X*/supabase_admin,service_role=X/supabase_admin} | Plataforma |
| vault.update_secret | secret_id uuid, new_secret text DEFAULT NULL::text, new_name text DEFAULT NULL::text, new_description text DEFAULT NULL::text, new_key_id uuid DEFAULT NULL::uuid | void | plpgsql | Sí | v | search_path="" | {supabase_admin=X/supabase_admin,postgres=X*/supabase_admin,service_role=X/supabase_admin} | Plataforma |
| vault._crypto_aead_det_decrypt | message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea | bytea | c | No | i | — | {supabase_admin=X/supabase_admin,postgres=X*/supabase_admin,service_role=X/supabase_admin} | Plataforma |
| extensions.pg_stat_statements_reset | userid oid DEFAULT 0, dbid oid DEFAULT 0, queryid bigint DEFAULT 0, minmax_only boolean DEFAULT false | timestamp with time zone | c | No | v | — | {postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.crypt | text, text | text | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.gen_salt | text | text | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.gen_salt | text, integer | text | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.encrypt | bytea, bytea, text | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.decrypt | bytea, bytea, text | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_sym_decrypt_bytea | bytea, text, text | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_pub_encrypt_bytea | bytea, bytea | bytea | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_pub_encrypt | text, bytea, text | bytea | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_pub_encrypt_bytea | bytea, bytea, text | bytea | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_pub_decrypt | bytea, bytea | text | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pgp_pub_decrypt_bytea | bytea, bytea | bytea | c | No | i | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.pg_stat_statements | showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone | SETOF record | c | No | v | — | {=X/postgres,postgres=X*/postgres,dashboard_user=X/postgres} | Plataforma |
| extensions.set_graphql_placeholder |  | event_trigger | plpgsql | No | v | search_path="" | {=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X*/supabase_admin} | Plataforma |
| extensions.grant_pg_net_access |  | event_trigger | plpgsql | No | v | search_path="" | {=X/supabase_admin,supabase_admin=X*/supabase_admin,dashboard_user=X/supabase_admin} | Plataforma |
| extensions.grant_pg_cron_access |  | event_trigger | plpgsql | No | v | search_path="" | {=X/supabase_admin,supabase_admin=X*/supabase_admin,dashboard_user=X/supabase_admin} | Plataforma |
| graphql_public.graphql | "operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb | jsonb | plpgsql | No | v | — | {=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin} | Plataforma |
| auth.jwt |  | jsonb | sql | No | s | — | {=X/supabase_auth_admin,postgres=X/supabase_auth_admin,supabase_auth_admin=X/supabase_auth_admin,dashboard_user=X/supabase_auth_admin} | Plataforma |
| storage.extension | name text | text | plpgsql | No | i | — | — | Plataforma |
| storage.foldername | name text | text[] | plpgsql | No | i | — | — | Plataforma |
| storage.filename | name text | text | plpgsql | No | i | — | — | Plataforma |
| storage.update_updated_at_column |  | trigger | plpgsql | No | v | — | — | Plataforma |
| storage.can_insert_object | bucketid text, name text, owner uuid, metadata jsonb | void | plpgsql | No | v | — | — | Plataforma |
| realtime.apply_rls | wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024) | SETOF realtime.wal_rls | plpgsql | No | v | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin,anon=X/supabase_realtime_admin,authenticated=X/supabase_realtime_admin,service_role=X/supabase_realtime_admin} | Plataforma |
| realtime.broadcast_changes | topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text | void | plpgsql | No | v | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin} | Plataforma |
| realtime.wal2json_escape_identifier | name text | text | sql | No | i | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin} | Plataforma |
| public.notify_order_ready |  | trigger | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 028_fase13_funciones_y_triggers.sql |
| storage.operation |  | text | plpgsql | No | s | — | — | Plataforma |
| storage.enforce_bucket_name_length |  | trigger | plpgsql | No | v | — | — | Plataforma |
| storage.get_common_prefix | p_key text, p_prefix text, p_delimiter text | text | sql | No | i | — | — | Plataforma |
| storage.protect_delete |  | trigger | plpgsql | No | v | — | — | Plataforma |
| storage.allow_only_operation | expected_operation text | boolean | sql | No | s | — | — | Plataforma |
| storage.allow_any_operation | expected_operations text[] | boolean | sql | No | s | — | — | Plataforma |
| public.rls_auto_enable |  | event_trigger | plpgsql | Sí | v | search_path=pg_catalog | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | Fuera de migrations |
| realtime.subscription_check_filters |  | trigger | plpgsql | No | v | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin,anon=X/supabase_realtime_admin,authenticated=X/supabase_realtime_admin,service_role=X/supabase_realtime_admin} | Plataforma |
| realtime.build_prepared_statement_sql | prepared_statement_name text, entity regclass, columns realtime.wal_column[] | text | sql | No | v | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin,anon=X/supabase_realtime_admin,authenticated=X/supabase_realtime_admin,service_role=X/supabase_realtime_admin} | Plataforma |
| realtime.check_equality_op | op realtime.equality_op, type_ regtype, val_1 text, val_2 text | boolean | plpgsql | No | i | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin,anon=X/supabase_realtime_admin,authenticated=X/supabase_realtime_admin,service_role=X/supabase_realtime_admin} | Plataforma |
| realtime.check_equality_op | op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean | boolean | plpgsql | No | s | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin,anon=X/supabase_realtime_admin,authenticated=X/supabase_realtime_admin,service_role=X/supabase_realtime_admin} | Plataforma |
| realtime.is_visible_through_filters | columns realtime.wal_column[], filters realtime.user_defined_filter[] | boolean | sql | No | s | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin,anon=X/supabase_realtime_admin,authenticated=X/supabase_realtime_admin,service_role=X/supabase_realtime_admin} | Plataforma |
| realtime.list_changes | publication name, slot_name name, max_changes integer, max_record_bytes integer | TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint) | sql | No | v | log_min_messages=fatal | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin} | Plataforma |
| realtime.quote_wal2json | entity regclass | text | sql | No | i | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin,anon=X/supabase_realtime_admin,authenticated=X/supabase_realtime_admin,service_role=X/supabase_realtime_admin} | Plataforma |
| realtime.send | payload jsonb, event text, topic text, private boolean DEFAULT true | void | plpgsql | No | v | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin} | Plataforma |
| realtime.send_binary | payload bytea, event text, topic text, private boolean DEFAULT true | void | plpgsql | No | v | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin} | Plataforma |
| realtime.to_regrole | role_name text | regrole | sql | No | i | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin,anon=X/supabase_realtime_admin,authenticated=X/supabase_realtime_admin,service_role=X/supabase_realtime_admin} | Plataforma |
| realtime.topic |  | text | sql | No | s | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin} | Plataforma |
| public.is_active_user |  | boolean | sql | Sí | s | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | Fuera de migrations |
| public.is_admin |  | boolean | sql | Sí | s | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | Fuera de migrations |
| public.is_employee_or_admin |  | boolean | sql | Sí | s | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | Fuera de migrations |
| public.handle_new_user |  | trigger | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | Fuera de migrations |
| public.handle_inventory_entry |  | trigger | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 006_fase3_inventario_triggers.sql |
| public.handle_inventory_waste |  | trigger | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 006_fase3_inventario_triggers.sql |
| public.handle_inventory_adjustment |  | trigger | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 006_fase3_inventario_triggers.sql |
| public.consume_product_inventory | p_product_id uuid, p_quantity_sold numeric, p_reference_type text, p_reference_id uuid, p_created_by uuid | void | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 008_fase4_consumo_fifo.sql |
| public.release_expired_reservations | p_inventory_item_id uuid DEFAULT NULL::uuid | integer | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 010_fase5_funciones_pedidos.sql |
| public.advance_order_status | p_order_id uuid, p_new_status text | void | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | Fuera de migrations |
| public.close_cash_session | p_session_id uuid, p_counted_amount numeric, p_closing_note text | void | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 023_fase10_funciones_caja.sql |
| public.reject_payment | p_payment_id uuid, p_reason text | void | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 013_fase6_funciones_pagos.sql |
| public.create_payment | p_order_id uuid | TABLE(id uuid, amount numeric, method text, status text, order_number bigint) | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 016_fase7_fix_create_payment_order_number.sql |
| public.cancel_order | p_order_id uuid, p_reason text | void | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 019_fase9_funciones.sql |
| public.create_sale_return | p_order_id uuid, p_type text, p_amount numeric, p_reason text | uuid | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 019_fase9_funciones.sql |
| public.record_cash_movement | p_cash_session_id uuid, p_movement_type text, p_amount numeric, p_direction text, p_reason text, p_order_id uuid | uuid | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 023_fase10_funciones_caja.sql |
| public.request_order_deletion | p_order_id uuid, p_reason text | uuid | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 019_fase9_funciones.sql |
| public.review_order_deletion_request | p_request_id uuid, p_approve boolean, p_review_reason text | void | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 019_fase9_funciones.sql |
| public.can_delete_cancelled_order | p_order_id uuid | boolean | sql | Sí | s | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 021_fase9_fix_can_delete_function.sql |
| public.open_cash_session | p_cash_register_id uuid, p_opening_amount numeric | uuid | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 023_fase10_funciones_caja.sql |
| public.get_business_status |  | TABLE(is_open boolean, opens_at time without time zone, closes_at time without time zone, is_closed_today boolean, accept_orders_outside_hours boolean) | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 028_fase13_funciones_y_triggers.sql |
| public.notify_stock_alert |  | trigger | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 028_fase13_funciones_y_triggers.sql |
| public.create_order | p_customer_name text, p_customer_phone text, p_customer_whatsapp text, p_items jsonb, p_customer_message text, p_idempotency_key text, p_promotion_id uuid | uuid | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 031_arma_tu_ramo_opciones_inventario.sql |
| public.apply_order_discount | p_order_id uuid, p_subtotal numeric, p_customer_id uuid, p_promotion_id uuid, p_manual_amount numeric, p_manual_reason text, p_actor_id uuid | numeric | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 034_proteccion_monto_fijo.sql |
| storage.protect_bucket_control_columns |  | trigger | plpgsql | No | v | search_path=pg_catalog | — | Plataforma |
| storage.enforce_bucket_lifecycle_service_role |  | trigger | plpgsql | No | v | search_path=pg_catalog | — | Plataforma |
| storage.list_multipart_uploads_with_delimiter | bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text, raw_prefix_param text DEFAULT NULL::text | TABLE(key text, id text, created_at timestamp with time zone) | sql | No | s | — | — | Plataforma |
| storage.list_objects_with_delimiter | _bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, next_token_archived_at timestamp with time zone DEFAULT NULL::timestamp with time zone, next_token_version text DEFAULT ''::text | TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean) | plpgsql | No | s | — | — | Plataforma |
| public.notify_pending_payment |  | trigger | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 028_fase13_funciones_y_triggers.sql |
| public.confirm_payment | p_payment_id uuid | void | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 013_fase6_funciones_pagos.sql |
| storage.search | prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text | TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean) | plpgsql | No | s | — | — | Plataforma |
| storage.search_by_timestamp | p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, p_start_after_version text DEFAULT ''::text | TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean) | plpgsql | No | s | — | — | Plataforma |
| storage.search_v2 | prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, start_after_archived_at timestamp with time zone DEFAULT NULL::timestamp with time zone, start_after_version text DEFAULT ''::text, start_after_is_continuation boolean DEFAULT false | TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean) | plpgsql | No | s | — | — | Plataforma |
| storage.get_size_by_bucket | noncurrent_versions text DEFAULT 'include'::text, delete_markers text DEFAULT 'include'::text | TABLE(size bigint, bucket_id text) | plpgsql | No | s | — | — | Plataforma |
| public.notify_new_order |  | trigger | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 028_fase13_funciones_y_triggers.sql |
| public.check_rate_limit | p_ip text, p_route text, p_max_attempts integer, p_window_seconds integer | boolean | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 029_fase14_rate_limiting.sql |
| public.audit_products_change |  | trigger | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 030_fase14_auditoria.sql |
| public.get_audit_trail | p_limit integer DEFAULT 100, p_offset integer DEFAULT 0 | SETOF audit_trail | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 030_fase14_auditoria.sql |
| public.track_order | p_order_number bigint, p_customer_phone text | TABLE(order_number bigint, status text, order_type text, subtotal numeric, discount_total numeric, total numeric, customer_message text, created_at timestamp with time zone, updated_at timestamp with time zone, items jsonb) | plpgsql | Sí | s | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 019_seguimiento_pedido_publico.sql |
| public.create_order | p_customer_name text, p_customer_phone text, p_customer_whatsapp text, p_items jsonb, p_customer_message text, p_idempotency_key text | uuid | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | Fuera de migrations |
| public.create_physical_sale | p_items jsonb, p_customer_id uuid, p_promotion_id uuid, p_manual_discount_amount numeric, p_manual_discount_reason text, p_payment_method text | TABLE(id uuid, order_number bigint, subtotal numeric, discount_total numeric, total numeric) | plpgsql | Sí | v | search_path=public | {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} | 026_fase12_venta_fisica_cliente_opcional.sql |
| realtime.settled_changes | slot_name name, max_changes integer, VARIADIC opts text[] | TABLE(lsn pg_lsn, xid xid, data text) | plpgsql | No | v | — | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin} | Plataforma |
| realtime.list_changes_sync | publication name, slot_name name, max_changes integer, max_record_bytes integer | TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint) | sql | No | v | log_min_messages=fatal | {=X/supabase_realtime_admin,supabase_realtime_admin=X/supabase_realtime_admin,postgres=X/supabase_realtime_admin,dashboard_user=X/supabase_realtime_admin} | Plataforma |

## Permisos efectivos de funciones públicas

| Función | EXECUTE anon | EXECUTE authenticated | EXECUTE service_role |
| --- | --- | --- | --- |
| notify_order_ready() | Sí | Sí | Sí |
| rls_auto_enable() | Sí | Sí | Sí |
| is_active_user() | Sí | Sí | Sí |
| is_admin() | Sí | Sí | Sí |
| is_employee_or_admin() | Sí | Sí | Sí |
| handle_new_user() | Sí | Sí | Sí |
| handle_inventory_entry() | Sí | Sí | Sí |
| handle_inventory_waste() | Sí | Sí | Sí |
| handle_inventory_adjustment() | Sí | Sí | Sí |
| consume_product_inventory(uuid,numeric,text,uuid,uuid) | Sí | Sí | Sí |
| release_expired_reservations(uuid) | Sí | Sí | Sí |
| advance_order_status(uuid,text) | Sí | Sí | Sí |
| close_cash_session(uuid,numeric,text) | Sí | Sí | Sí |
| reject_payment(uuid,text) | Sí | Sí | Sí |
| create_payment(uuid) | Sí | Sí | Sí |
| cancel_order(uuid,text) | Sí | Sí | Sí |
| create_sale_return(uuid,text,numeric,text) | Sí | Sí | Sí |
| record_cash_movement(uuid,text,numeric,text,text,uuid) | Sí | Sí | Sí |
| request_order_deletion(uuid,text) | Sí | Sí | Sí |
| review_order_deletion_request(uuid,boolean,text) | Sí | Sí | Sí |
| can_delete_cancelled_order(uuid) | Sí | Sí | Sí |
| open_cash_session(uuid,numeric) | Sí | Sí | Sí |
| get_business_status() | Sí | Sí | Sí |
| notify_stock_alert() | Sí | Sí | Sí |
| create_order(text,text,text,jsonb,text,text,uuid) | Sí | Sí | Sí |
| apply_order_discount(uuid,numeric,uuid,uuid,numeric,text,uuid) | Sí | Sí | Sí |
| notify_pending_payment() | Sí | Sí | Sí |
| confirm_payment(uuid) | Sí | Sí | Sí |
| notify_new_order() | Sí | Sí | Sí |
| check_rate_limit(text,text,integer,integer) | Sí | Sí | Sí |
| audit_products_change() | Sí | Sí | Sí |
| get_audit_trail(integer,integer) | Sí | Sí | Sí |
| track_order(bigint,text) | Sí | Sí | Sí |
| create_order(text,text,text,jsonb,text,text) | Sí | Sí | Sí |
| create_physical_sale(jsonb,uuid,uuid,numeric,text,text) | Sí | Sí | Sí |

## Permisos efectivos de tablas/vistas públicas

Los grants de tabla no desactivan RLS. audit_logs/rate_limit_attempts tienen RLS sin políticas, y audit_trail tiene revocación de SELECT público.

| Objeto | SELECT anon | SELECT auth | INSERT anon | UPDATE anon | DELETE anon |
| --- | --- | --- | --- | --- | --- |
| profiles | Sí | Sí | Sí | Sí | Sí |
| categories | Sí | Sí | Sí | Sí | Sí |
| product_components | Sí | Sí | Sí | Sí | Sí |
| customization_options | Sí | Sí | Sí | Sí | Sí |
| customers | Sí | Sí | Sí | Sí | Sí |
| inventory_reservations | Sí | Sí | Sí | Sí | Sí |
| order_items | Sí | Sí | Sí | Sí | Sí |
| cash_movements | Sí | Sí | Sí | Sí | Sí |
| cash_registers | Sí | Sí | Sí | Sí | Sí |
| cash_sessions | Sí | Sí | Sí | Sí | Sí |
| business_hours | Sí | Sí | Sí | Sí | Sí |
| audit_logs | Sí | Sí | Sí | Sí | Sí |
| notifications | Sí | Sí | Sí | Sí | Sí |
| audit_trail | No | No | No | No | No |
| customization_option_inventory_requirements | Sí | Sí | Sí | Sí | Sí |
| inventory_adjustments | Sí | Sí | Sí | Sí | Sí |
| inventory_entries | Sí | Sí | Sí | Sí | Sí |
| inventory_items | Sí | Sí | Sí | Sí | Sí |
| inventory_lots | Sí | Sí | Sí | Sí | Sí |
| inventory_movements | Sí | Sí | Sí | Sí | Sí |
| inventory_waste | Sí | Sí | Sí | Sí | Sí |
| order_deletion_requests | Sí | Sí | Sí | Sí | Sí |
| order_discounts | Sí | Sí | Sí | Sí | Sí |
| orders | Sí | Sí | Sí | Sí | Sí |
| payment_qr_config | Sí | Sí | Sí | Sí | Sí |
| payments | Sí | Sí | Sí | Sí | Sí |
| product_images | Sí | Sí | Sí | Sí | Sí |
| product_inventory_requirements | Sí | Sí | Sí | Sí | Sí |
| products | Sí | Sí | Sí | Sí | Sí |
| promotion_products | Sí | Sí | Sí | Sí | Sí |
| promotions | Sí | Sí | Sí | Sí | Sí |
| rate_limit_attempts | Sí | Sí | Sí | Sí | Sí |
| sale_returns | Sí | Sí | Sí | Sí | Sí |
| seasons | Sí | Sí | Sí | Sí | Sí |
| system_settings | Sí | Sí | Sí | Sí | Sí |
| whatsapp_config | Sí | Sí | Sí | Sí | Sí |

## ACL por defecto

| Rol propietario | Schema | Clase | ACL |
| --- | --- | --- | --- |
| postgres | public | r | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} |
| postgres | public | f | {postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} |
| postgres | public | S | {postgres=rwU/postgres,anon=rwU/postgres,authenticated=rwU/postgres,service_role=rwU/postgres} |
| supabase_admin | public | S | {postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin} |
| supabase_admin | public | r | {postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin} |
| supabase_admin | public | f | {postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin} |
| postgres | storage | r | {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres} |
| postgres | storage | f | {postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} |
| postgres | storage | S | {postgres=rwU/postgres,anon=rwU/postgres,authenticated=rwU/postgres,service_role=rwU/postgres} |
| supabase_auth_admin | auth | r | {postgres=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin} |
| supabase_auth_admin | auth | S | {postgres=rwU/supabase_auth_admin,dashboard_user=rwU/supabase_auth_admin} |
| supabase_auth_admin | auth | f | {postgres=X/supabase_auth_admin,dashboard_user=X/supabase_auth_admin} |
| supabase_admin | graphql_public | S | {postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin} |
| supabase_admin | graphql_public | r | {postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin} |
| supabase_admin | graphql_public | f | {postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin} |
| supabase_admin | extensions | r | {postgres=a*r*w*d*D*x*t*m*/supabase_admin} |
| supabase_admin | extensions | f | {postgres=X*/supabase_admin} |
| supabase_admin | extensions | S | {postgres=r*w*U*/supabase_admin} |
| supabase_admin | graphql | r | {postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin} |
| supabase_admin | graphql | f | {postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin} |
| supabase_admin | graphql | S | {postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin} |
| supabase_admin | realtime | S | {postgres=rwU/supabase_admin,dashboard_user=rwU/supabase_admin} |
| supabase_admin | realtime | f | {postgres=X/supabase_admin,dashboard_user=X/supabase_admin} |
| supabase_admin | realtime | r | {postgres=a*r*wdDxtm/supabase_admin,dashboard_user=arwdDxtm/supabase_admin} |

## Event triggers

| Nombre | Evento | Enabled | Función | Tags |
| --- | --- | --- | --- | --- |
| issue_graphql_placeholder | sql_drop | O | set_graphql_placeholder() | DROP EXTENSION |
| pgrst_ddl_watch | ddl_command_end | O | pgrst_ddl_watch() | — |
| pgrst_drop_watch | sql_drop | O | pgrst_drop_watch() | — |
| issue_pg_cron_access | ddl_command_end | O | grant_pg_cron_access() | CREATE EXTENSION |
| issue_pg_net_access | ddl_command_end | O | grant_pg_net_access() | CREATE EXTENSION |
| issue_pg_graphql_access | ddl_command_end | O | grant_pg_graphql_access() | CREATE EXTENSION |
| ensure_rls | ddl_command_end | O | rls_auto_enable() | CREATE TABLE, CREATE TABLE AS, SELECT INTO |

## Vistas/materializadas

| Objeto | Tipo | Definición |
| --- | --- | --- |
| vault.decrypted_secrets | v |  SELECT id,     name,     description,     secret,     convert_from(vault._crypto_aead_det_decrypt(message => decode(secret, 'base64'::text), additional => convert_to(id::text, 'utf8'::name), key_id => 0::bigint, context => '\x7067736f6469756d'::bytea, nonce => nonce), 'utf8'::name) AS decrypted_secret,     key_id,     nonce,     created_at,     updated_at    FROM vault.secrets s; |
| public.audit_trail | v |  SELECT audit_logs.user_id,     audit_logs.action,     audit_logs.table_name,     audit_logs.record_id,     audit_logs.before,     audit_logs.after,     audit_logs.reason,     audit_logs.created_at    FROM audit_logs UNION ALL  SELECT orders.cancelled_by AS user_id,     'pedido_cancelado'::text AS action,     'orders'::text AS table_name,     orders.id AS record_id,     NULL::jsonb AS before,     NULL::jsonb AS after,     orders.cancellation_reason AS reason,     orders.cancelled_at AS created_at    FROM orders   WHERE orders.status = 'cancelado'::text AND orders.cancelled_by IS NOT NULL UNION ALL  SELECT payments.confirmed_by AS user_id,     'pago_confirmado'::text AS action,     'payments'::text AS table_name,     payments.id AS record_id,     NULL::jsonb AS before,     NULL::jsonb AS after,     NULL::text AS reason,     payments.confirmed_at AS created_at    FROM payments   WHERE payments.status = 'confirmado'::text AND payments.confirmed_by IS NOT NULL UNION ALL  SELECT payments.rejected_by AS user_id,     'pago_rechazado'::text AS action,     'payments'::text AS table_name,     payments.id AS record_id,     NULL::jsonb AS before,     NULL::jsonb AS after,     payments.rejection_reason AS reason,     payments.rejected_at AS created_at    FROM payments   WHERE payments.status = 'rechazado'::text AND payments.rejected_by IS NOT NULL UNION ALL  SELECT inventory_movements.created_by AS user_id,     'inventario_'::text \|\| inventory_movements.movement_type AS action,     'inventory_movements'::text AS table_name,     inventory_movements.id AS record_id,     NULL::jsonb AS before,     NULL::jsonb AS after,     inventory_movements.reason,     inventory_movements.created_at    FROM inventory_movements   WHERE inventory_movements.movement_type = ANY (ARRAY['merma'::text, 'ajuste'::text, 'reversion'::text]) UNION ALL  SELECT sale_returns.created_by AS user_id,     'devolucion_registrada'::text AS action,     'sale_returns'::text AS table_name,     sale_returns.id AS record_id,     NULL::jsonb AS before,     NULL::jsonb AS after,     sale_returns.reason,     sale_returns.created_at    FROM sale_returns UNION ALL  SELECT order_discounts.created_by AS user_id,     'descuento_aplicado'::text AS action,     'order_discounts'::text AS table_name,     order_discounts.id AS record_id,     NULL::jsonb AS before,     NULL::jsonb AS after,     order_discounts.reason,     order_discounts.created_at    FROM order_discounts; |

## Storage

| Bucket | Público | Límite bytes | MIME | Archivos (conteo) |
| --- | --- | --- | --- | --- |
| product-images | Sí | 5242880 | image/jpeg, image/png, image/webp | 7 |
| payment-qr | Sí | — | — | 0 |

## Realtime

| Publicación | Todas las tablas | Insert | Update | Delete | Truncate |
| --- | --- | --- | --- | --- | --- |
| supabase_realtime | No | Sí | Sí | Sí | Sí |

| Publicación | Schema | Tabla | Columnas | Filtro |
| --- | --- | --- | --- | --- |


## Cron y Vault

No existe cron.job ni está instalada pg_cron. Vault está instalado; el conteo de secretos es 0. No se leyó contenido de secretos. Hay event triggers de plataforma que conceden acceso cuando se instalan extensiones; no equivalen a que pg_cron/pg_net estén instaladas.
