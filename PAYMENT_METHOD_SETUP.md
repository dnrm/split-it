# Configuración del Método de Pago

## Pasos para configurar la funcionalidad de método de pago

### 1. Aplicar el Schema de Base de Datos

Debes ejecutar el archivo SQL en tu base de datos de Supabase:

```bash
# Opción 1: Desde el Dashboard de Supabase
# Ve a SQL Editor y ejecuta el contenido de payment-methods-schema.sql

# Opción 2: Usando la CLI de Supabase
supabase db push
```

O manualmente en el SQL Editor de Supabase, copia y pega el contenido de `payment-methods-schema.sql`.

### 2. Funcionalidades Implementadas

#### ✅ Navegación

- Se agregó un menú "Payment Method" en el dropdown del perfil del usuario
- Icono de tarjeta de crédito para mejor UX
- Enlace directo a `/dashboard/payment-method`

#### ✅ Formulario Completo

El formulario incluye:

- **Número de tarjeta**: Con formato automático (espacios cada 4 dígitos)
- **Nombre del titular**: Convertido automáticamente a mayúsculas
- **Fecha de vencimiento**: Mes y año con validación
- **CVV**: Campo de contraseña para seguridad
- **Dirección de facturación**: Campo opcional
- **Código postal**: Requerido
- **País**: Selector con países principales de Latinoamérica

#### ✅ Validaciones

- Validación de longitud del número de tarjeta (13-19 dígitos)
- Validación de fecha de vencimiento (no puede ser pasada)
- Validación de CVV (3-4 dígitos)
- Validación de código postal
- Detección automática del tipo de tarjeta (Visa, Mastercard, Amex)

#### ✅ Seguridad

- **Enmascaramiento de tarjeta**: Solo se almacenan los últimos 4 dígitos
- **Row Level Security (RLS)**: Los usuarios solo pueden ver sus propios métodos de pago
- **Políticas de acceso**: Restricciones a nivel de base de datos
- El número de tarjeta completo NUNCA se almacena en la base de datos

#### ✅ Funcionalidades Adicionales

- Actualizar método de pago existente
- Eliminar método de pago con confirmación
- Información de seguridad visible para el usuario
- Diseño responsive (mobile-friendly)
- Mensajes de éxito/error con toast notifications

### 3. Estructura de la Base de Datos

La tabla `payment_methods` incluye:

- `id`: UUID único
- `user_id`: Referencia al usuario
- `card_number_masked`: Número de tarjeta enmascarado (\***\* \*\*** \*\*\*\* 1234)
- `card_holder_name`: Nombre del titular
- `card_type`: Tipo de tarjeta (Visa, Mastercard, etc.)
- `expiry_month`: Mes de vencimiento
- `expiry_year`: Año de vencimiento
- `billing_address`: Dirección de facturación (opcional)
- `postal_code`: Código postal
- `country`: País
- `is_default`: Si es el método de pago por defecto
- `created_at` y `updated_at`: Marcas de tiempo

### 4. Próximos Pasos Recomendados

Para una implementación completa en producción, considera:

1. **Integración con procesador de pagos real** (Stripe, PayPal, MercadoPago)

   - Los procesadores de pagos manejan el almacenamiento seguro de tarjetas
   - Utilizan tokenización para mayor seguridad
   - Cumplen con PCI-DSS automáticamente

2. **Encriptación adicional**

   - Aunque el número de tarjeta está enmascarado, considera encriptar todos los campos sensibles

3. **Verificación de tarjeta**

   - Implementar verificación con cargo mínimo ($1) que se reembolsa automáticamente

4. **Múltiples métodos de pago**

   - Permitir que el usuario tenga varias tarjetas guardadas
   - Sistema para seleccionar la tarjeta por defecto

5. **Historial de transacciones**
   - Tabla adicional para registrar todos los pagos realizados y recibidos

### 5. Uso de la Funcionalidad

1. El usuario hace clic en su icono de perfil en la barra de navegación
2. Selecciona "Payment Method" del menú
3. Completa el formulario con los datos de su tarjeta
4. Los datos se guardan de forma segura y enmascarada
5. Puede actualizar o eliminar su método de pago en cualquier momento

### 6. Seguridad y Cumplimiento

⚠️ **IMPORTANTE**: Esta implementación es un MVP para demostración. Para producción:

- Utiliza un procesador de pagos certificado PCI-DSS (Stripe, PayPal, etc.)
- NUNCA almacenes números de tarjeta completos en tu base de datos
- Implementa HTTPS en toda la aplicación
- Considera auditorías de seguridad regulares

## Archivos Creados

- `app/dashboard/payment-method/page.tsx` - Página principal del método de pago
- `components/payment/payment-method-form.tsx` - Formulario con validación
- `payment-methods-schema.sql` - Schema de la base de datos
- `components/dashboard/dashboard-nav.tsx` - Actualizado con el nuevo menú
