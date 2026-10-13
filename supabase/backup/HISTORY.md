# Historial de backup — referencia, no instrucciones vigentes

La decisión final del propietario reemplaza las propuestas anteriores: backup semanal **manual de DB**, sin automatización ni backup de imágenes. Las instrucciones vigentes son [README.md](README.md).

- `ee16ad0dcbdca7d0e2646387dc650056d5a91f14`: propuesta inicial de copia cifrada a proveedor externo. Nunca se conectó un proveedor ni se ejecutó backup productivo.
- `b3a450295fd1248160d22620f5278862a0503d71`: restore DB LOCAL validado con propietarios/ACL correctos; se conserva esa herramienta.
- `096f888e2c5053acccc63cfbbe39d8eecf0bf90b`: límites de la certificación previa de dos QR y backup LOCAL; 49 checks HTTP y recorridos de navegador quedaron registrados en el informe de dos QR.
- `2bc6e8cf9c70e4e18d9ddc8db7484b47235b56f1`: ensayo LOCAL de DB + Storage, 12 objetos íntegros, 72 tablas y 11 grupos de catálogo, Auth y tres referencias producto/QR; 19 tests de herramientas. Implementación y reporte detallado permanecen accesibles en ese commit. No son la solución vigente y no se mantienen como una segunda herramienta operativa.

En la simplificación se retiran workflow, transporte externo, copia/restauración de bytes Storage y tests exclusivos de esas funciones. No se borran backups cifrados, claves o evidencias privadas de laboratorios. Se conserva el informe humano de dos QR con una aclaración de su alcance histórico.

Los ensayos previos no demostraron un backup productivo ni un proveedor real. La decisión actual acepta expresamente que recuperar DB **no recupera imágenes**. No debe activarse una tarea antigua utilizando estas referencias.
