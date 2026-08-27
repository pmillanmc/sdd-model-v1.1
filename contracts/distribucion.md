# Cómo se distribuye el framework SDD

**Estado:** vigente desde 2026-08-27. Cierra el ítem 4.2 de `contracts/rollout-multirepo.md`.
**Audiencia:** quien instala el modelo en un repo, y quien mantiene el modelo.

Qué es la capa A y qué significa una versión está en `contracts/framework.md`.
Las rutas que este mecanismo escribe están en `contracts/paths.md`.
Este documento explica **cómo viaja** el framework de upstream a cada repo.

---

## 1. Las cuatro capas del mecanismo

Confundirlas es lo que hace que la discusión sobre distribución no cierre. Son cuatro problemas
distintos con cuatro soluciones distintas:

| Capa | Qué resuelve | Cómo |
|---|---|---|
| **Transporte** | Cómo los bytes llegan de upstream a la máquina | `npx github:…`, paquete, o `git clone` de un tag |
| **Instalación** | Cómo esos bytes llegan a las rutas donde el modelo los lee | `sdd-install.mjs` |
| **Verificación** | Probar que son los bytes de esa versión | `sdd-verify.mjs` + `.claude/MANIFEST.sha256` |
| **Control** | Que ningún repo quede atrás sin enterarse | gate en el CI de cada consumidor |

**El transporte es la capa que menos importa.** Las tres opciones producen el mismo árbol y el
mismo manifiesto; se elige por ergonomía, no por arquitectura. Las otras tres son obligatorias.

### Por qué existe la capa de instalación

Es la pregunta que más se repite. La CLI de Claude lee `.claude/commands/`, `.claude/skills/` y
`.claude/hooks/` **desde la raíz del proyecto**, sin punto de configuración. Un paquete en
`node_modules/` o un submódulo en `.sdd/` no los ve nadie. Por eso el transporte deja los bytes en
algún lado y `sdd-install` los materializa en la raíz.

Consecuencia útil: **el árbol materializado se commitea, `node_modules/` no.** Quien clona un repo
con el modelo instalado lo tiene funcionando sin instalar nada. El transporte hace falta para
*cambiar* de versión, no para *usar* el modelo.

---

## 2. Qué escribe la instalación

Las tres semánticas de `contracts/framework.md` §2, con la lista canónica en
`contracts/framework-files.txt`:

| Tipo | Qué toca | Regla |
|---|---|---|
| `EXACT` | comandos, skills, hooks, scripts, contratos, plantillas | Copia el archivo entero |
| `BLOCK` | `CLAUDE.md` | Solo lo que está entre los marcadores `SDD:FRAMEWORK`. El resto es del repo |
| `MERGE` | `package.json` | Solo las claves declaradas. El resto es del repo |

Dos negativas que son parte del contrato:

- **No pisa drift.** Si el destino tiene capa A editada localmente, `sdd-install` aborta y la
  lista. Pisarlo en silencio borraría la evidencia de que alguien editó el framework en destino.
  `--force` descarta esa evidencia y es una decisión humana explícita.
- **No escribe fuera del árbol destino.** Las rutas de la lista canónica se validan al parsearlas
  —sin `..`, sin absolutas, sin letra de unidad— y se vuelve a verificar antes de cada escritura.

---

## 3. Instalar

```bash
npx github:pmillanmc/sdd-model-v1.1 init      # sin token: el repo del modelo es público
```

`sdd init` materializa, corre el gestor de paquetes del repo (deducido del lockfile), verifica
integridad y audita. Después: commitear y correr `/sdd-setup`.

Antes de instalar en un repo con historia, `sdd init --dry-run` lista qué crearía y **qué archivo
del repo pisaría**, sin escribir nada.

Con el paquete agregado (`pnpm add -D @pmillanmc/sdd-framework`) el comando queda local:
`pnpm exec sdd init`. Cuesta un token con `read:packages` —GitHub Packages lo pide aunque el
paquete sea público— y a cambio actualizar es `pnpm update`.

| Comando | Qué hace |
|---|---|
| `sdd init` | Materializa, instala dependencias, verifica y audita |
| `sdd update` | Lo mismo; el nombre existe porque es lo que se busca al cambiar de versión |
| `sdd check` | Verifica integridad y consistencia, sin escribir nada |
| `sdd version` | Qué versión corre este repo y cuál es la última publicada |

---

## 4. Publicar una versión

```bash
node scripts/sdd-bump.mjs minor          # 4 superficies + manifiesto, de una
# entrada en CHANGELOG.md; nota de migración si es MAJOR
node scripts/sdd-manifest.mjs            # el CHANGELOG es entrada EXACT
git tag -a v1.7.0 -m "framework 1.7.0" && git push --follow-tags
```

El push del tag dispara `sdd-release.yml`, que pone cuatro puertas antes de publicar: las tres
versiones coinciden, el manifiesto está al día, el árbol está íntegro, el auditor pasa. Después
empaqueta, firma ese `.tgz` con una attestation de procedencia y publica.

**Un tag publicado nunca se mueve.** Si el release salió mal, sale el siguiente PATCH. Mover un
tag ya consumido deja a esos repos apuntando a algo que ya no existe, y el manifiesto empieza a
fallar señalando el lugar equivocado.

---

## 5. Quién verifica qué

Tres preguntas distintas, tres dueños. Confundirlas es lo que hace que una instalación rota pase
en verde.

| Pregunta | Qué compara | Quién | ¿Red? |
|---|---|---|---|
| ¿La instalación está íntegra? | `MANIFEST.sha256` ↔ árbol materializado | `sdd-verify`, CI del consumidor | No |
| ¿Es internamente consistente? | `.claude/VERSION` ↔ `skills/VERSION`, marcadores | `sdd-audit`, CHECK 8 | No |
| ¿Este repo quedó atrás? | `.claude/VERSION` ↔ último tag upstream | `sdd-version.yml` | **Sí** |

La tercera no la hace el auditor porque el auditor está definido como offline y sin IA; meterle una
llamada de red cambiaría lo que es.

El veredicto del gate lo decide `estadoVersion` en `scripts/lib/framework.mjs`, y depende de un
solo dígito: **atrás por MINOR o PATCH avisa; atrás por un MAJOR rompe el build.** Para eso sirve
la disciplina de versionado de `contracts/framework.md` §4 — no es taxonomía, es el input de ese
`if`. **Quedarse atrás es una opción legítima**; lo que no puede pasar es quedarse atrás sin
enterarse.

### Integridad no es autenticidad

`MANIFEST.sha256` **viaja adentro de la instalación**: prueba que los bytes no cambiaron desde que
se hashearon, pero quien comprometa el upstream lo regenera y valida perfecto. Detecta
modificación local, no un publisher malicioso.

La autenticidad la da la **attestation de procedencia** que `sdd-release.yml` adjunta al paquete:
sigstore firma con la identidad OIDC del workflow, sin llave privada que guardar ni rotar. Prueba
de qué repo, qué commit y qué workflow salió el artefacto.

```bash
gh attestation verify <archivo>.tgz --repo pmillanmc/sdd-model-v1.1
```

Verificá el `.tgz` **publicado**, no uno reconstruido localmente: el empaquetado es determinista en
la misma máquina, pero cambia entre plataformas (los permisos de archivo difieren entre Windows y
Linux).

---

## 6. Lo que este mecanismo no resuelve

- **Quién consume el modelo.** Ni un paquete ni un submódulo le dan a upstream forma de saberlo: no
  hay backlink en ninguna de las dos tecnologías. Por eso el control es un gate en cada consumidor
  y no un inventario central.
- **Los skills globales.** `sync-skills.mjs` copia a `~/.claude/skills/` con `force: true`: el
  destino es el usuario, no el repo. Dos proyectos en versiones distintas en la misma máquina y
  gana el último sync. Ver `contracts/framework.md` §6.
- **`.claude/settings.json`.** No es capa A —lleva permisos y rutas de máquina— pero es donde se
  declara el `SessionStart` hook. Es el único archivo de `.claude/` que puede ejecutar código y que
  el manifiesto no cubre.
- **El contrato entre codebases.** Que dos repos corran la misma versión del framework no dice nada
  sobre si sus APIs siguen siendo compatibles entre sí.

---

## 7. Qué es capa A y qué es upstream-only

Todo lo que lista `contracts/framework-files.txt` se materializa en cada repo. Lo que **no** está
en esa lista vive solo en el repo del modelo:

| Archivo | Por qué no se distribuye |
|---|---|
| `.github/workflows/sdd-release.yml` | Un repo de código que taggee su propia app no puede terminar publicando el framework |
| `scripts/sdd-selftest.mjs` | Prueba el framework, no una instalación. Para eso está `sdd check` |
| `README.md`, `demo/`, `*.html` | Documentan o ilustran *este* repo |

El fixture `demo/` es **visual** —existe para que `pnpm kanban:demo` renderice un tablero
realista— y hoy **no pasa el auditor**: su registro declara features sin carpeta de spec ni
métricas. Es deliberado hasta nuevo aviso; `pnpm audit:sdd --root demo` falla y no es un bug.
