# Especificación de Requisitos de Software (SRS)

## Proyecto: FoodPass Mobile
**Programa:** Tecnólogo en Análisis y Desarrollo de Software (ADSO)
**Ficha:** [Número de Ficha]
**Aprendices / Autores:** [Nombres completos]
**Instructor Líder:** [Nombre del Instructor]
**Fecha:** 07 de Octubre de 2026 | **Versión:** 1.0

---

### 1. INTRODUCCIÓN

#### 1.1 Propósito
Este documento define los requisitos funcionales y no funcionales del sistema **FoodPass Mobile**, una aplicación móvil multiplataforma (iOS & Android) para la gestión de alimentos, inventario y ventas. Sirve como contrato técnico entre el equipo de desarrollo y los usuarios del proyecto, alineado con las normas IEEE 830/29148 y los criterios de calidad ISO/IEC 25010.

#### 1.2 Alcance del proyecto
La aplicación permite a los usuarios registrar, consultar y actualizar productos, crear órdenes de compra, y generar reportes desde dispositivos móviles, cubriendo las fases del ciclo de vida del software (ISO/IEC 12207): Análisis, Diseño, Desarrollo e Implementación.
- **Incluye:** Módulo de autenticación, gestión de productos (CRUD), proceso de órdenes, generación de reportes exportables, notificaciones push.
- **No incluye:** Integración con hardware externo no contemplado (ej. lectores biométricos) ni servicios de terceros sin API abierta.

#### 1.3 Definiciones, acrónimos y abreviaturas
| Acrónimo | Significado |
|----------|------------|
| ADSO | Análisis y Desarrollo de Software |
| SRS | Software Requirements Specification |
| IEEE | Institute of Electrical and Electronics Engineers |
| ISO/IEC 25010 | Modelo de calidad del producto de software |
| CRUD | Create, Read, Update, Delete |
| RF / RNF | Requisito Funcional / Requisito No Funcional |
| API | Application Programming Interface |
| JWT | JSON Web Token |
| HTTPS | HyperText Transfer Protocol Secure |
| FCM | Firebase Cloud Messaging |

#### 1.4 Referencias
- IEEE Std 830 / IEEE 29148 – Especificación de Requisitos de Software.
- ISO/IEC 25010 – Modelo de calidad del software.
- ISO/IEC 12207 – Procesos del ciclo de vida del software.
- Guías de estilo de código y arquitectura de la Universidad SENA.
- Documentación de React Native y Expo v54.0.0.

---

### 2. DESCRIPCIÓN GENERAL DEL SISTEMA

#### 2.1 Perspectiva del producto
FoodPass Mobile es una aplicación **cross‑platform** desarrollada con **React Native** y **Expo SDK v54** que consume la misma API RESTful del backend de FoodPass Web. La arquitectura sigue el patrón **MVVM** con capas de presentación, lógica de negocio y acceso a datos.

#### 2.2 Perfil de actores / usuarios
| Rol | Descripción | Nivel de acceso |
|-----|-------------|-----------------|
| Administrador | Configura usuarios, parámetros globales y gestiona todos los recursos desde la app. | CRUD total, generación de reportes, parametrización. |
| Instructor / Líder | Supervisa actividades, audita y genera reportes de uso móvil. | Lectura avanzada, aprobación, exportación. |
| Técnico | Realiza registro de productos, actualización de inventario y consulta de órdenes. | CRUD limitado a su zona, visualización de reportes. |
| Aprendiz / Cliente | Usa la app para consultar catálogo y crear pedidos. | Lectura, creación de órdenes, envío de evidencia. |

#### 2.3 Restricciones del proyecto
1. **Técnicas:** Desarrollo con React Native + Expo v54, arquitectura MVVM, comunicación mediante API RESTful JSON. 
2. **Normativas:** Cumplimiento de la Ley de Protección de Datos Personales (Habeas Data) y normas de citación APA.
3. **Metodológicas:** Desarrollo bajo marcos ágiles (Scrum / XP) con entregas en sprints.

---

### 3. REQUISITOS ESPECÍFICOS (IEEE 830 / ISO 25010)

#### 3.1 Requisitos funcionales (RF)
| Código | Módulo | Descripción | Entrada | Proceso | Salida | Regla de negocio |
|--------|--------|-------------|---------|---------|--------|-------------------|
| RF‑01 | Seguridad y Control de Acceso | Autenticación mediante email y contraseña encriptada, emisión de JWT y asignación de rol. | Email, contraseña | Validación contra BD, verificación de hash, generación de JWT. | Token de sesión + navegación a pantalla principal o mensaje de error. | Bloqueo de cuenta tras 3 intentos fallidos (30 min). |
| RF‑02 | Gestión de Productos (CRUD) | Permite crear, leer, actualizar y desactivar productos desde el móvil. | Formulario de producto (nombre, código, categoría, precio, estado). | Verificación de unicidad, guardado en BD vía API. | Mensaje de éxito y vista actualizada del listado. | Borrado lógico obligatorio; historial preservado. |
| RF‑03 | Procesamiento de Órdenes | Cliente crea y envía una orden de compra desde la app. | Carrito, datos de envío, método de pago. | Cálculo de total, reserva de stock, registro de orden en BD. | Confirmación de orden con número de referencia y notificación push. | Adjuntos (factura, evidencia) máximo 20 MB y formatos PDF/ZIP. |
| RF‑04 | Trazabilidad de Actividades | Registro de cambios de estado, timestamps y usuarios en la app. | Acción (cambio de estado, comentario). | Inserción de registro en tabla de auditoría vía API. | Notificación en UI y registro persistente. | Cada cambio queda auditado; los logs son inmutables. |
| RF‑05 | Generación y Exportación de Reportes | Exporta reportes filtrados (fechas, estado, usuario) en PDF/Excel y los comparte vía email o descarga. | Rango de fechas, filtros. | Consulta optimizada, generación de archivo con pdf-lib / exceljs. | Vista previa y archivo descargable; opción de compartir. | Generación ≤ 3 s bajo 50 usuarios concurrentes. |
| RF‑06 | Notificaciones Push | Informa al usuario sobre cambios críticos (orden completada, stock bajo). | Evento del backend. | Envío mediante FCM a dispositivos registrados. | Notificación visible en la barra del móvil. | Retención de token FCM segura y renovable cada 30 días. |

#### 3.2 Requisitos no funcionales (RNF)
| Código | Categoría (ISO 25010) | Métrica / Criterio de aceptación |
|--------|----------------------|---------------------------------|
| RNF‑01 | Eficiencia de desempeño | Tiempo de respuesta de la API ≤ 2 s bajo carga de 50 usuarios concurrentes; pantalla inicial carga ≤ 1 s. |
| RNF‑02 | Seguridad | Contraseñas almacenadas con **bcrypt** (cost = 12) o **Argon2**; comunicación obligatoria vía **HTTPS**; tokens JWT firmados con algoritmo **HS256** y expiración de 1 h. |
| RNF‑03 | Usabilidad | UI responsiva, cumple con WCAG AA (contraste, tamaños de toque). |
| RNF‑04 | Mantenibilidad | Código documentado con JSDoc, linting ESLint, arquitectura MVVM que separa lógica de UI. |
| RNF‑05 | Compatibilidad | Soporte en iOS 15+ y Android 12+. |
| RNF‑06 | Fiabilidad | Backups automáticos diarios de la base de datos; mecanismo de reconexión automática a la API ante pérdida de red. |
| RNF‑07 | Portabilidad | Aplicación empaquetada con **Expo** permite distribución vía tiendas (App Store, Google Play) sin cambios de código. |

---

### 4. ANEXOS Y MATRIZ DE TRAZABILIDAD
#### 4.1 Matriz de trazabilidad (RF ↔ ISO 25010 ↔ Casos de uso)
| Requisito Funcional | Atributo ISO 25010 | Caso de Uso Asociado |
|---------------------|-------------------|----------------------|
| RF‑01 | Seguridad | CU‑01: Iniciar Sesión Mobile |
| RF‑02 | Adecuación Funcional | CU‑02: Gestionar Producto Mobile |
| RF‑03 | Fiabilidad / Trazabilidad | CU‑03: Registrar Orden Mobile |
| RF‑04 | Analizabilidad | CU‑04: Generar Reporte Mobile |
| RF‑05 | Portabilidad | CU‑05: Exportar Datos Mobile |
| RF‑06 | Compatibilidad | CU‑06: Notificaciones Push |

#### 4.2 Artefactos complementarios requeridos
- Diagrama de casos de uso (UML) para la versión móvil.
- Diagrama entidad‑relación (DER) de la base de datos (compartido con Web).
- Prototipos de pantalla / Wireframes (Figma o Balsamiq) de la app móvil.
- Especificación de permisos y configuración de **FCM**.

---

*Fin del documento SRS para FoodPass Mobile.*
