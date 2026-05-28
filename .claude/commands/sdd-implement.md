Leé estos cuatro archivos en orden:
1. constitution.md
2. spec.md
3. plan.md
4. tasks.md

Si existe `existing-arch.md` en la raíz, leélo TAMBIÉN antes de tocar código.
En modo brownfield:
- Trabajá dentro del `source_root` declarado (NO crees una carpeta `app/` nueva).
- Usá el gestor de paquetes declarado en `existing-arch.md` (puede no ser pnpm).
- Respetá los patrones inquebrantables — no introduzcas convenciones nuevas sin que estén en `plan.md`.
- Antes de crear un archivo nuevo, verificá si ya existe uno con responsabilidad equivalente; si lo hay, modificalo en vez de duplicarlo.

Cuando termines, implementá todas las tareas de tasks.md en orden,
respetando los principios de constitution.md.
Usá pnpm como gestor de paquetes salvo que `existing-arch.md` indique otro.
Empezá directamente, sin pedir confirmación.


**Gobernanza de Cierre:** Antes de dar por terminada la implementación, debes generar obligatoriamente el reporte de métricas en la carpeta `metrics/` basándote en la estructura definida en `sdd-metrics.md`.