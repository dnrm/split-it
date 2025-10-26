-- Crear tabla para métodos de pago
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number_masked TEXT NOT NULL, -- Solo almacenar últimos 4 dígitos enmascarados
  card_holder_name TEXT NOT NULL,
  card_type TEXT, -- Visa, Mastercard, American Express, etc.
  expiry_month TEXT NOT NULL,
  expiry_year TEXT NOT NULL,
  billing_address TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

-- RLS (Row Level Security) - Solo el usuario puede ver y modificar sus propios métodos de pago
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propios métodos de pago
CREATE POLICY "Users can view their own payment methods" 
  ON payment_methods FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar sus propios métodos de pago
CREATE POLICY "Users can insert their own payment methods" 
  ON payment_methods FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus propios métodos de pago
CREATE POLICY "Users can update their own payment methods" 
  ON payment_methods FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus propios métodos de pago
CREATE POLICY "Users can delete their own payment methods" 
  ON payment_methods FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_methods_updated_at();

-- Asegurar que solo haya un método de pago por defecto por usuario
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_default_payment_method
  AFTER INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_payment_method();

