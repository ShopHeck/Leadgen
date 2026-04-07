import { auth } from "../../auth";
import { SignInForm } from "../../components/sign-in-form";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/app");
  }

  const params = await searchParams;

  return <SignInForm callbackUrl={params.callbackUrl} />;
}

