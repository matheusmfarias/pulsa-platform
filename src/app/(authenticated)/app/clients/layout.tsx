import { requireActiveOrganization } from "@/modules/organizations";
import { toPublicErrorMessage } from "@/shared/errors";

export default async function ClientsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  try {
    await requireActiveOrganization();
  } catch (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <section className="mt-6 max-w-xl rounded-lg border bg-card p-6">
          <p className="text-sm text-destructive" role="alert">
            {toPublicErrorMessage(error)}
          </p>
        </section>
      </main>
    );
  }

  return children;
}
