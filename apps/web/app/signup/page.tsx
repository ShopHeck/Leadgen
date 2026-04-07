import { auth } from "../../auth";
import { SignUpForm } from "../../components/sign-up-form";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/app");
  }

  return <SignUpForm />;
}

