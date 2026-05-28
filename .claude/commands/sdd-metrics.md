# Comando: Generar Reporte de Métricas (Telemetría SDD)

**Descripción:** Este comando audita la eficiencia de la sesión actual y la claridad de la especificación.

## Instrucciones para el Agente
Cuando se invoque este comando, debes crear un archivo en la carpeta `metrics/` llamado `[feature-name]-metrics.md` con la siguiente estructura exacta:

### 📊 Reporte de Esfuerzo SDD

**Eficiencia de la IA (DX)**
- [ ] DX_MET_001 **Ciclos de Autocorrección**: [Número de veces que un test falló y tuviste que arreglar el código por tu cuenta].
- [ ] DX_MET_002 **Consultas de Clarificación**: [Número de veces que tuviste que preguntarle al usuario por falta de detalles en la spec].
- [ ] DX_MET_003 **Interacciones Totales**: [Cantidad de prompts/turnos usados].

**Análisis de Retrabajo**
- [ ] DX_MET_004 **Causa Raíz**: [Si hubo errores, explica brevemente si fue culpa técnica o por ambigüedad de la Spec].
- [ ] DX_MET_005 **Resiliencia**: [¿Alcanzaste algún límite de rate-limit o tokens durante la tarea?].