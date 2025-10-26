import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PaymentMethodForm } from "@/components/payment/payment-method-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default async function PaymentMethodPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Obtener el método de pago existente del usuario si existe
  const { data: paymentMethod } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Método de Pago</h1>
        <p className="text-muted-foreground">
          Configura tu método de pago para realizar y recibir pagos de forma
          segura
        </p>
      </div>

      <div className="grid gap-6">
        {/* Tarjeta de crédito/débito */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Tarjeta de Crédito o Débito
            </CardTitle>
            <CardDescription>
              Ingresa los datos de tu tarjeta para realizar pagos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentMethodForm
              userId={user.id}
              existingPaymentMethod={paymentMethod}
            />
          </CardContent>
        </Card>

        {/* Información de seguridad */}
        <Card>
          <CardHeader>
            <CardTitle>Seguridad y Privacidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              🔒{" "}
              <span>
                Todos los datos bancarios se almacenan de forma encriptada
              </span>
            </p>
            <p className="flex items-start gap-2">
              🛡️{" "}
              <span>
                Utilizamos estándares PCI-DSS para proteger tu información
              </span>
            </p>
            <p className="flex items-start gap-2">
              ✅{" "}
              <span>
                Nunca compartiremos tus datos con terceros sin tu consentimiento
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
