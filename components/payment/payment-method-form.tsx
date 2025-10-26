"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Validación del formulario
const paymentMethodSchema = z.object({
  card_number: z
    .string()
    .transform((val) => val.replace(/\s/g, "")) // Eliminar espacios antes de validar
    .pipe(
      z
        .string()
        .min(13, "El número de tarjeta debe tener al menos 13 dígitos")
        .max(19, "El número de tarjeta debe tener máximo 19 dígitos")
        .regex(/^\d+$/, "El número de tarjeta solo debe contener dígitos")
    ),
  card_holder_name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre es demasiado largo"),
  expiry_month: z
    .string()
    .regex(/^(0[1-9]|1[0-2])$/, "Mes inválido"),
  expiry_year: z
    .string()
    .regex(/^\d{4}$/, "Año inválido")
    .refine((year) => {
      const currentYear = new Date().getFullYear();
      return parseInt(year) >= currentYear;
    }, "La tarjeta está vencida"),
  cvv: z
    .string()
    .min(3, "CVV debe tener 3 o 4 dígitos")
    .max(4, "CVV debe tener 3 o 4 dígitos")
    .regex(/^\d+$/, "CVV solo debe contener dígitos"),
  billing_address: z.string().optional(),
  postal_code: z
    .string()
    .min(4, "Código postal inválido")
    .max(10, "Código postal inválido"),
  country: z.string().min(2, "Selecciona un país"),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

interface PaymentMethodFormProps {
  userId: string;
  existingPaymentMethod?: any;
}

export function PaymentMethodForm({
  userId,
  existingPaymentMethod,
}: PaymentMethodFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      card_number: existingPaymentMethod?.card_number_masked || "",
      card_holder_name: existingPaymentMethod?.card_holder_name || "",
      expiry_month: existingPaymentMethod?.expiry_month || "",
      expiry_year: existingPaymentMethod?.expiry_year || "",
      cvv: "",
      billing_address: existingPaymentMethod?.billing_address || "",
      postal_code: existingPaymentMethod?.postal_code || "",
      country: existingPaymentMethod?.country || "",
    },
  });

  // Formatear número de tarjeta con espacios
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const onSubmit = async (data: PaymentMethodFormValues) => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Enmascarar el número de tarjeta (guardar solo los últimos 4 dígitos)
      const cardNumberClean = data.card_number.replace(/\s/g, "");
      const lastFourDigits = cardNumberClean.slice(-4);
      const maskedCardNumber = `**** **** **** ${lastFourDigits}`;

      const paymentData = {
        user_id: userId,
        card_number_masked: maskedCardNumber,
        card_holder_name: data.card_holder_name,
        expiry_month: data.expiry_month,
        expiry_year: data.expiry_year,
        billing_address: data.billing_address || null,
        postal_code: data.postal_code,
        country: data.country,
        card_type: detectCardType(cardNumberClean),
      };

      if (existingPaymentMethod) {
        // Actualizar método de pago existente
        const { error } = await supabase
          .from("payment_methods")
          .update(paymentData)
          .eq("id", existingPaymentMethod.id);

        if (error) throw error;
        toast.success("Método de pago actualizado correctamente");
      } else {
        // Crear nuevo método de pago
        const { error } = await supabase
          .from("payment_methods")
          .insert(paymentData);

        if (error) throw error;
        toast.success("Método de pago agregado correctamente");
      }

      router.refresh();
    } catch (error) {
      console.error("Error al guardar método de pago:", error);
      toast.error("Error al guardar el método de pago");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingPaymentMethod) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", existingPaymentMethod.id);

      if (error) throw error;

      toast.success("Método de pago eliminado");
      router.refresh();
    } catch (error) {
      console.error("Error al eliminar método de pago:", error);
      toast.error("Error al eliminar el método de pago");
    } finally {
      setIsDeleting(false);
    }
  };

  const detectCardType = (cardNumber: string): string => {
    if (cardNumber.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(cardNumber)) return "Mastercard";
    if (/^3[47]/.test(cardNumber)) return "American Express";
    return "Other";
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear + i);
  const months = [
    { value: "01", label: "01 - Enero" },
    { value: "02", label: "02 - Febrero" },
    { value: "03", label: "03 - Marzo" },
    { value: "04", label: "04 - Abril" },
    { value: "05", label: "05 - Mayo" },
    { value: "06", label: "06 - Junio" },
    { value: "07", label: "07 - Julio" },
    { value: "08", label: "08 - Agosto" },
    { value: "09", label: "09 - Septiembre" },
    { value: "10", label: "10 - Octubre" },
    { value: "11", label: "11 - Noviembre" },
    { value: "12", label: "12 - Diciembre" },
  ];

  const countries = [
    { value: "MX", label: "México" },
    { value: "US", label: "Estados Unidos" },
    { value: "CA", label: "Canadá" },
    { value: "ES", label: "España" },
    { value: "AR", label: "Argentina" },
    { value: "CO", label: "Colombia" },
    { value: "CL", label: "Chile" },
    { value: "PE", label: "Perú" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Número de tarjeta */}
        <FormField
          control={form.control}
          name="card_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Tarjeta</FormLabel>
              <FormControl>
                <Input
                  placeholder="1234 5678 9012 3456"
                  {...field}
                  onChange={(e) => {
                    const formatted = formatCardNumber(
                      e.target.value.replace(/\s/g, "")
                    );
                    field.onChange(formatted);
                  }}
                  maxLength={19}
                  disabled={!!existingPaymentMethod}
                />
              </FormControl>
              <FormDescription>
                {existingPaymentMethod
                  ? "No puedes cambiar el número de tarjeta. Elimina y agrega una nueva."
                  : "Ingresa el número de tu tarjeta sin espacios"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nombre del titular */}
        <FormField
          control={form.control}
          name="card_holder_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Titular</FormLabel>
              <FormControl>
                <Input
                  placeholder="Juan Pérez"
                  {...field}
                  onChange={(e) =>
                    field.onChange(e.target.value.toUpperCase())
                  }
                />
              </FormControl>
              <FormDescription>
                Nombre como aparece en la tarjeta
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fecha de vencimiento y CVV */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="expiry_month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mes de Vencimiento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiry_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Año de Vencimiento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cvv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CVV</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="123"
                    {...field}
                    maxLength={4}
                  />
                </FormControl>
                <FormDescription>3 o 4 dígitos</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dirección de facturación */}
        <FormField
          control={form.control}
          name="billing_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección de Facturación (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Calle Principal 123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Código postal y país */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Postal</FormLabel>
                <FormControl>
                  <Input placeholder="12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un país" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3 justify-end">
          {existingPaymentMethod && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente tu método de pago.
                    No podrás realizar ni recibir pagos hasta que agregues uno
                    nuevo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button type="submit" disabled={isLoading}>
            <CreditCard className="h-4 w-4 mr-2" />
            {isLoading
              ? "Guardando..."
              : existingPaymentMethod
              ? "Actualizar Método de Pago"
              : "Guardar Método de Pago"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

