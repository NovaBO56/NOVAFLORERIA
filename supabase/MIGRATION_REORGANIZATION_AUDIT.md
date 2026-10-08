# Auditoría de conservación de migraciones

Reorganización local realizada el 8 de octubre de 2026. Se conservaron los 39 originales con sus nombres y SHA-256 exactos. El archivo vacío 034 fix modulo pedidos.sql permanece solo en legacy.

La cadena activa está en migrations/; legacy no se ejecuta. La consolidación posterior modifica únicamente comentarios del SQL activo y seed; el SQL ejecutable se comparó con el snapshot certificado y permanece idéntico. Ninguna operación remota.

Los informes completos, inventarios y snapshots se preservan en un backup privado local y en el historial Git anterior a esta consolidación (f021381761557ba8fbcf538073f2fc4e7c9c39d2). No se publican nuevamente capturas detalladas ni datos de laboratorio. La limpieza no elimina sus versiones ya publicadas del historial Git; no se reescribió historia.

| Archivo histórico | SHA-256 original y vigente |
|---|---|
| 001_correccion_rls_fase2.sql | 929b4f2d8d0c2e167c20d4095bc302264b66e6d4535c1e0857f05ce0551c69c2 |
| 002_correccion_rls_catalogo_empleado.sql | 5ffa61a15c27908a3d47596bc47cdbcf83614085d9afabb81e73b76ea1ed746f |
| 003_correccion_storage_product_images_empleado.sql | 5b61aa3419e2ae71fef52e2509a8f5a175dde4256eea6247f37cead28f5487eb |
| 004_correccion_rls_profiles.sql | 9dbd4aa03ae232388712671955b301bfbc742fc1fd9520e85180c8c419051d63 |
| 005_fase3_inventario_tablas.sql | ceddbd7e9e9a4159a6a9ed794ec7654373ccae2f0bd3d60677c6e4e73393b795 |
| 006_fase3_inventario_triggers.sql | 103601057ff356a5d89d45f018c3438783b8828bd4573d180679dd5fa3e5522d |
| 007_fase4_arreglos_tablas.sql | b48f16c3ed2ed2359ca235a47bbd60213e555ba0521ca34ff802d67e75db8d29 |
| 008_fase4_consumo_fifo.sql | 6894dd916178d58573d76ed72f77f91c3b0ed26c8ed215537c3f65ff164adf40 |
| 009_fase5_pedidos_tablas.sql | 8a83cf1c936a72e3e982f940e94c01c68f9a0cac76580ea8b60fd3c2c1a678bc |
| 010_fase5_funciones_pedidos.sql | 6d944d59058cf28ea58544b600437d10ac63545f32e0874a48a94fef16daeac4 |
| 011_fase5_pedido_publico.sql | 9d9480654d21173bd2fba1ccc4f97c7d4fa26f066eaf3873cca92f94c2c1a8db |
| 012_fase6_pagos_qr_tablas.sql | d21eea0441ed213e026e33de303768014c116b3592bc8b5a208d1f6e55a94a46 |
| 013_fase6_funciones_pagos.sql | 7fbcdaa6131d8c3408926e780625869fab8ff4ce1fa64399e08bb2855bbbd1d0 |
| 014_fase6_fix_create_payment_return.sql | ba08b0440ed69ef3c8397ad9ce0d4c6c7bc84cbfe715ee560e2b4ff115dc7f5b |
| 015_fase7_whatsapp_config.sql | eb1749e27a22202108124e48feb6d515f4196d9177f12a251296ba4faf8d1dad |
| 016_fase7_fix_create_payment_order_number.sql | 640514121525119ed42a189e09eefe44c20c9e306e9c0f521cac9505c503ba75 |
| 017_fase8_venta_fisica.sql | 7658994a92923dad64c5ce84991b3e842c264e620234abca0aade9df5cfc39ad |
| 018_catalogo_publico_rls.sql | f3815d7d6ff001eceb41017d704801b0da8c483e6135cf786d1136c825b6080b |
| 018_fase9_tablas.sql | a9bd87302e1db8e0fc0e2f2951cac31e0478721fd4920fbdbfc8a5b1ce9da344 |
| 019_fase9_funciones.sql | e1cf7baf989f3432c340abdce1444b2b87eb2cf0a51fc87b06845b9f408c93c7 |
| 019_seguimiento_pedido_publico.sql | c544b6d8bd8ecfbb20c4bbed293818f1c8c3b373108bd7cf279760dafb2f16dd |
| 020_fase5_fix_extra_price_personalizacion.sql | 2bfac27c5873c2010da0346bcc60f12c3ee40f1887e66d130343d274fe272f38 |
| 020_fase9_fix_cancel_order_overload.sql | 2f4cc258e0a91668c6bc761f77e2bfefc51298268f3f745aa007dc0dff95b419 |
| 021_fase9_fix_can_delete_function.sql | 7520ebaadab66c6c38dc31269e1970a9655487ce998c776293f15fc03a745061 |
| 022_fase10_caja_tablas.sql | 2785f5b82cdb4f134c9a440d3d5d256de817de886d2a5d0637e61e3506d2f52e |
| 023_fase10_funciones_caja.sql | 73c737eb63a26c39c610a2c59bb695386183c7c4afcc928f651429a30680cdc8 |
| 024_fase11_clientes_promociones_tablas.sql | ae9f4d143b418f2cf91d6c33eb79517e12e786f43354c05aeddbf3da13fea72f |
| 025_fase11_funciones_promociones.sql | 38754a5f90c857605a0ffa499789c96c3faf1568c4f01507902a5dcbbc92802f |
| 026_fase12_venta_fisica_cliente_opcional.sql | a81b8bc34b80fa543072801bcb638b1a71da2b9121c61bc367aa525dd30d31a7 |
| 027_fase13_tablas.sql | bc0ae58d4d5412b7770e368121c0e3b4b568a8d2dd6a0aa45c3d2ca466b4d19f |
| 028_fase13_funciones_y_triggers.sql | 4c74b9cf8bb547de82835bf473e35fe430d66b7bfd0b3cfc0dd1830b1b57c7b9 |
| 029_fase14_rate_limiting.sql | d74fc034bb146b90cd00a0f6fe4724ab8396b71c24611e72ecfd9def75e1cde1 |
| 030_fase14_auditoria.sql | db39ab4c968c5e2ec6d6199b8581ec8f4e289f1d9f4a3f1214a8d2c66e129ec1 |
| 031_arma_tu_ramo_opciones_inventario.sql | c120772662da4680e8dfd8d0cd36079a7c90a1ac8c7a0017be178e6665805e31 |
| 032_rediseno_promociones.sql | 8b9d2c090906383128419bdb4c94ec966eb39543bfcc59f4e42114f26ed2b883 |
| 033_reparacion_promociones.sql | 1444db423884935ee3fbf35cd917e44d04e26c34c4a2383a21b7c0900d2b4c96 |
| 034 fix modulo pedidos.sql | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| 034_proteccion_monto_fijo.sql | 99dd4fda905075d02babe3eec786a45741ff8547fff982a46f6b807036ecd591 |
| 035_checkout_public_summary.sql | 5c72b1099244e4ad6f9ab5fa01a47193f252999c7b2956140f97d83b6cf948bb |